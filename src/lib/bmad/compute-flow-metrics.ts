import type { FileRevision } from "@/lib/content-provider";
import type { FlowMetrics, StoryStatus, StoryTiming } from "./types";
import { parseSprintStatus } from "./parse-sprint-status";

const ACTIVE: ReadonlySet<StoryStatus> = new Set(["in-progress", "review"]);
const MS_DAY = 24 * 60 * 60 * 1000;
const MS_WEEK = 7 * MS_DAY;

interface StoryLifecycle {
  id: string;
  title: string;
  firstSeenAt: number | null;
  firstActiveAt: number | null;
  doneAt: number | null;
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

/**
 * Build agile flow metrics from chronological sprint-status.yaml revisions.
 *
 * - Lead time: first appearance → done
 * - Cycle time: first in-progress/review → done (falls back to lead)
 * - Throughput: completions in the last 7 days
 * - Velocity/week: completions / observed weeks of history
 */
export function computeFlowMetrics(
  revisions: FileRevision[],
  nowMs: number = Date.now(),
): FlowMetrics {
  if (revisions.length === 0) return emptyMetrics();

  const ordered = [...revisions].sort(
    (a, b) =>
      new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime(),
  );

  const lives = new Map<string, StoryLifecycle>();

  for (const rev of ordered) {
    const at = new Date(rev.committedAt).getTime();
    if (Number.isNaN(at)) continue;
    const parsed = parseSprintStatus(rev.content);
    if (!parsed) continue;

    for (const story of parsed.sprintStatus.stories) {
      if (story.status === "cancelled") continue;
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
  }

  const timings: StoryTiming[] = [];
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
    });
    if (life.doneAt >= weekAgo) throughput7d += 1;
  }

  if (timings.length === 0) {
    return { ...emptyMetrics(), throughput7d };
  }

  const byCycle = [...timings].sort((a, b) => a.cycleMs - b.cycleMs);
  const firstAt = new Date(ordered[0].committedAt).getTime();
  const lastAt = new Date(ordered[ordered.length - 1].committedAt).getTime();
  const spanWeeks = Math.max((lastAt - firstAt) / MS_WEEK, 1 / 7);
  const doneCount = timings.length;

  return {
    sampleSize: timings.length,
    averageCycleMs: average(timings.map((t) => t.cycleMs)),
    averageLeadMs: average(timings.map((t) => t.leadMs)),
    fastest: byCycle[0] ?? null,
    slowest: byCycle[byCycle.length - 1] ?? null,
    throughput7d,
    velocityPerWeek: Math.round((doneCount / spanWeeks) * 10) / 10,
  };
}

export async function loadFlowMetrics(
  getRevisions: ((path: string, limit: number) => Promise<FileRevision[]>) | undefined,
  sprintStatusPath: string | undefined,
  limit = 80,
): Promise<FlowMetrics | null> {
  if (!getRevisions || !sprintStatusPath) return null;
  try {
    const revisions = await getRevisions(sprintStatusPath, limit);
    if (revisions.length === 0) return emptyMetrics();
    return computeFlowMetrics(revisions);
  } catch (error) {
    console.warn("[BMAD Flow] failed to load sprint history:", error);
    return null;
  }
}
