import type { FileRevision } from "@/lib/content-provider";
import type {
  FlowMetrics,
  SprintFlowPoint,
  StoryStatus,
  StoryTiming,
} from "./types";
import { parseSprintStatus } from "./parse-sprint-status";

const ACTIVE: ReadonlySet<StoryStatus> = new Set(["in-progress", "review"]);
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;
/** Sprint dates are calendar days in Brazil. */
const SPRINT_TZ_OFFSET = "-03:00";

export interface SprintWindow {
  number: number;
  startDate: string;
  endDate: string;
}

interface StoryLifecycle {
  id: string;
  title: string;
  firstSeenAt: number | null;
  firstActiveAt: number | null;
  doneAt: number | null;
}

interface Snapshot {
  at: number;
  wip: number;
  blocked: number;
}

interface TimedCompletion extends StoryTiming {
  doneAt: number;
}

function emptyMetrics(): FlowMetrics {
  return {
    sampleSize: 0,
    averageCycleMs: null,
    averageLeadMs: null,
    fastest: null,
    slowest: null,
    throughput7d: 0,
    velocityPerWeek: null,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function dayStartMs(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00${SPRINT_TZ_OFFSET}`);
}

/**
 * A sprint window runs from its Monday until the next sprint's Monday, so
 * weekend completions are not lost. The last sprint closes three days after
 * its Friday.
 */
function sprintWindows(sprints: SprintWindow[]) {
  const ordered = [...sprints].sort((a, b) => a.number - b.number);
  return ordered.map((sprint, index) => {
    const next = ordered[index + 1];
    const startMs = dayStartMs(sprint.startDate);
    const endMs = next
      ? dayStartMs(next.startDate)
      : dayStartMs(sprint.endDate) + 3 * MS_DAY;
    return { sprint, startMs, endMs };
  });
}

function buildSprintSeries(
  sprints: SprintWindow[],
  lives: Iterable<StoryLifecycle>,
  timings: TimedCompletion[],
  snapshots: Snapshot[],
  firstAt: number,
  nowMs: number,
): SprintFlowPoint[] {
  const completions: number[] = [];
  for (const life of lives) {
    if (life.doneAt === null) continue;
    // Already done in the first revision: finished before history began.
    if (life.doneAt === firstAt) continue;
    completions.push(life.doneAt);
  }

  return sprintWindows(sprints).map(({ sprint, startMs, endMs }) => {
    const base = {
      number: sprint.number,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    };
    if (startMs > nowMs || endMs <= firstAt) {
      return {
        ...base,
        observed: false,
        partial: false,
        completed: 0,
        velocityPerWeek: null,
        averageCycleMs: null,
        averageLeadMs: null,
        wipAtEnd: null,
        blockedAtEnd: null,
      };
    }

    const inWindow = (at: number) => at >= startMs && at < endMs;
    const completed = completions.filter(inWindow).length;
    const timed = timings.filter((t) => inWindow(t.doneAt));
    const observedEnd = Math.min(endMs, nowMs);
    const weeks = Math.max(observedEnd - startMs, MS_DAY) / MS_WEEK;
    const last = [...snapshots].reverse().find((s) => s.at < observedEnd);

    return {
      ...base,
      observed: true,
      partial: startMs < firstAt || nowMs < endMs,
      completed,
      velocityPerWeek: Math.round((completed / weeks) * 10) / 10,
      averageCycleMs: average(timed.map((t) => t.cycleMs)),
      averageLeadMs: average(timed.map((t) => t.leadMs)),
      wipAtEnd: last?.wip ?? null,
      blockedAtEnd: last?.blocked ?? null,
    };
  });
}

/**
 * Build agile flow metrics from chronological sprint-status.yaml revisions.
 *
 * - Lead time: first appearance → done
 * - Cycle time: first in-progress/review → done (falls back to lead)
 * - Throughput: completions in the last 7 days
 * - Velocity/week: completions / observed weeks of history
 * - Sprints: the same numbers grouped by the sprint in which each story
 *   reached done, plus WIP and blocked at the sprint's last revision
 */
export function computeFlowMetrics(
  revisions: FileRevision[],
  nowMs: number = Date.now(),
  sprints?: SprintWindow[],
): FlowMetrics {
  if (revisions.length === 0) return emptyMetrics();

  const ordered = [...revisions].sort(
    (a, b) =>
      new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime(),
  );

  const lives = new Map<string, StoryLifecycle>();
  const snapshots: Snapshot[] = [];

  for (const rev of ordered) {
    const at = new Date(rev.committedAt).getTime();
    if (Number.isNaN(at)) continue;
    const parsed = parseSprintStatus(rev.content);
    if (!parsed) continue;

    let wip = 0;
    let blocked = 0;
    for (const story of parsed.sprintStatus.stories) {
      if (story.status === "cancelled") continue;
      if (ACTIVE.has(story.status)) wip += 1;
      if (story.status === "blocked") blocked += 1;
      let life = lives.get(story.id);
      if (!life) {
        life = {
          id: story.id,
          title: story.title,
          firstSeenAt: null,
          firstActiveAt: null,
          doneAt: null,
        };
        lives.set(story.id, life);
      }
      if (life.title !== story.title) life.title = story.title;
      if (life.firstSeenAt === null) life.firstSeenAt = at;
      if (ACTIVE.has(story.status) && life.firstActiveAt === null) {
        life.firstActiveAt = at;
      }
      if (story.status === "done" && life.doneAt === null) {
        life.doneAt = at;
      }
    }
    snapshots.push({ at, wip, blocked });
  }

  const timings: TimedCompletion[] = [];
  let throughput7d = 0;
  const weekAgo = nowMs - MS_WEEK;

  for (const life of lives.values()) {
    if (life.doneAt === null || life.firstSeenAt === null) continue;
    const leadStart = life.firstSeenAt;
    const cycleStart = life.firstActiveAt ?? life.firstSeenAt;
    const leadMs = life.doneAt - leadStart;
    const cycleMs = life.doneAt - cycleStart;
    if (leadMs < 0 || cycleMs < 0) continue;
    // Appeared already done with no prior revision → no measurable duration.
    if (leadMs === 0 && life.firstActiveAt === null) continue;

    timings.push({
      id: life.id,
      title: life.title,
      cycleMs,
      leadMs,
      doneAt: life.doneAt,
    });
    if (life.doneAt >= weekAgo) throughput7d += 1;
  }

  const firstAt = snapshots[0]?.at ?? null;
  const history =
    firstAt === null
      ? {}
      : {
          historyStartsAt: new Date(firstAt).toISOString(),
          ...(sprints
            ? {
                sprints: buildSprintSeries(
                  sprints,
                  lives.values(),
                  timings,
                  snapshots,
                  firstAt,
                  nowMs,
                ),
              }
            : {}),
        };

  if (timings.length === 0) {
    return { ...emptyMetrics(), throughput7d, ...history };
  }

  const toTiming = ({ id, title, cycleMs, leadMs }: TimedCompletion) => ({
    id,
    title,
    cycleMs,
    leadMs,
  });
  const byCycle = [...timings].sort((a, b) => a.cycleMs - b.cycleMs);
  const lastAt = new Date(ordered[ordered.length - 1].committedAt).getTime();
  const spanWeeks = Math.max((lastAt - (firstAt ?? lastAt)) / MS_WEEK, 1 / 7);
  const doneCount = timings.length;

  return {
    sampleSize: timings.length,
    averageCycleMs: average(timings.map((t) => t.cycleMs)),
    averageLeadMs: average(timings.map((t) => t.leadMs)),
    fastest: byCycle[0] ? toTiming(byCycle[0]) : null,
    slowest: byCycle.length > 0 ? toTiming(byCycle[byCycle.length - 1]) : null,
    throughput7d,
    velocityPerWeek: Math.round((doneCount / spanWeeks) * 10) / 10,
    ...history,
  };
}

export async function loadFlowMetrics(
  getRevisions: ((path: string, limit: number) => Promise<FileRevision[]>) | undefined,
  sprintStatusPath: string | undefined,
  limit = 80,
  sprints?: SprintWindow[],
): Promise<FlowMetrics | null> {
  if (!getRevisions || !sprintStatusPath) return null;
  try {
    const revisions = await getRevisions(sprintStatusPath, limit);
    if (revisions.length === 0) return emptyMetrics();
    return computeFlowMetrics(revisions, Date.now(), sprints);
  } catch (error) {
    console.warn("[BMAD Flow] failed to load sprint history:", error);
    return null;
  }
}
