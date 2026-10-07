import { StatsCard } from "@/components/shared/stats-card";
import { StaggeredList, StaggeredItem } from "@/components/shared/staggered-list";
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Timer,
  Gauge,
  Zap,
  Turtle,
  Rabbit,
} from "lucide-react";
import { activeDeliveryStatuses } from "@/lib/bmad/delivery";
import type { FlowMetrics, SprintStatus, StoryStatus } from "@/lib/bmad/types";

interface VelocityMetricsProps {
  sprintStatus: SprintStatus | null;
  flowMetrics?: FlowMetrics | null;
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 60_000) return "<1m";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = ms / 3_600_000;
  if (hours < 48) {
    const whole = Math.floor(hours);
    const remMin = Math.round((hours - whole) * 60);
    return remMin > 0 ? `${whole}h ${remMin}m` : `${whole}h`;
  }
  const days = ms / 86_400_000;
  if (days < 14) return `${days.toFixed(1)}d`;
  return `${Math.round(days)}d`;
}

const LINEAR_B_BENCHMARKS =
  "https://linearb.io/blog/software-development-metrics-guide";
const DORA_2024 = "https://dora.dev/research/2024/dora-report/";
const PROKANBAN_WIP =
  "https://prokanban.org/blog/dont-just-limit-wip-optimize-it";
const SCRUM_GUIDE = "https://scrumguides.org/scrum-guide.html";
const KANBAN_GUIDE = "https://kanbanguides.org/english/";

function MarketNote({
  children,
  href,
  title,
}: {
  children: string;
  href: string;
  title: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function storyLabel(id: string, title: string): string {
  const slug = title
    .replace(/^(?:\d+-\d+[A-Za-z]?-|(?:[a-z][a-z0-9_-]*)-\d+-)/i, "")
    .replace(/-/g, " ");
  const short = slug.length > 36 ? `${slug.slice(0, 33)}…` : slug;
  return short ? `${id} · ${short}` : id;
}

export function VelocityMetrics({
  sprintStatus,
  flowMetrics,
}: VelocityMetricsProps) {
  if (!sprintStatus) return null;

  const stories: StoryStatus[] = activeDeliveryStatuses(
    sprintStatus.stories,
    [],
  );
  const totalStories = stories.length;
  const doneCount = stories.filter((status) => status === "done").length;
  const wipCount = stories.filter(
    (status) => status === "in-progress" || status === "review",
  ).length;
  const blockedCount = stories.filter((status) => status === "blocked").length;
  const readyCount = stories.filter(
    (status) => status === "ready-for-dev",
  ).length;
  const backlogCount = stories.filter((status) => status === "backlog").length;

  const sample = flowMetrics?.sampleSize ?? 0;
  const hasTiming = sample > 0;

  const cardClass = "h-72 overflow-hidden";

  return (
    <div className="space-y-4">
      <StaggeredList className="grid items-stretch gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Velocity"
            value={
              flowMetrics?.velocityPerWeek != null
                ? flowMetrics.velocityPerWeek
                : doneCount
            }
            icon={TrendingUp}
            description={
              flowMetrics?.velocityPerWeek != null
                ? `${doneCount} done · per week`
                : `${totalStories} active stories`
            }
            color="success"
            footnote={
              <>
                No cross-team story rate. Elite &gt;2.25 PRs/dev/week —{" "}
                <MarketNote
                  href={LINEAR_B_BENCHMARKS}
                  title="LinearB 2025 benchmarks from 6.1M pull requests. Merge frequency is pull requests per developer per week, not BMAD stories."
                >
                  LinearB 2025
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="WIP"
            value={wipCount}
            icon={Activity}
            description="In progress + review"
            color="info"
            footnote={
              <>
                About ⅔–¾ of the team —{" "}
                <MarketNote
                  href={PROKANBAN_WIP}
                  title="ProKanban Featureban simulations: a WIP limit around two-thirds to three-quarters of the team (example: 6 items for 9 people)."
                >
                  ProKanban
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Throughput 7d"
            value={flowMetrics?.throughput7d ?? "—"}
            icon={Zap}
            description={
              flowMetrics
                ? "Stories finished last 7 days"
                : "Needs sprint history"
            }
            color="violet"
            footnote={
              <>
                Elite &gt;2.25 merges/dev/week —{" "}
                <MarketNote
                  href={LINEAR_B_BENCHMARKS}
                  title="LinearB 2025 elite merge frequency is more than 2.25 pull requests merged per developer per week."
                >
                  LinearB 2025
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Avg cycle time"
            value={
              hasTiming ? formatDuration(flowMetrics?.averageCycleMs) : "—"
            }
            icon={Timer}
            description={
              hasTiming
                ? `Lead ${formatDuration(flowMetrics?.averageLeadMs)} · n=${sample}`
                : "In progress → done"
            }
            color="primary"
            footnote={
              <>
                Elite &lt;26h code→prod —{" "}
                <MarketNote
                  href={LINEAR_B_BENCHMARKS}
                  title="LinearB 2025 elite cycle time is under 26 hours from first commit to production. This card measures story status, from in progress to done."
                >
                  LinearB 2025
                </MarketNote>
                . Lead &lt;1 day —{" "}
                <MarketNote
                  href={DORA_2024}
                  title="DORA 2024 elite change lead time is less than one day from commit to production."
                >
                  DORA 2024
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Fastest done"
            value={
              hasTiming ? formatDuration(flowMetrics?.fastest?.cycleMs) : "—"
            }
            icon={Rabbit}
            description={
              flowMetrics?.fastest
                ? storyLabel(flowMetrics.fastest.id, flowMetrics.fastest.title)
                : "Shortest cycle"
            }
            color="success"
            footnote={
              <>
                Elite cycle &lt;26h code→prod —{" "}
                <MarketNote
                  href={LINEAR_B_BENCHMARKS}
                  title="LinearB 2025 elite cycle time is under 26 hours from code to production."
                >
                  LinearB 2025
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Slowest done"
            value={
              hasTiming ? formatDuration(flowMetrics?.slowest?.cycleMs) : "—"
            }
            icon={Turtle}
            description={
              flowMetrics?.slowest
                ? storyLabel(flowMetrics.slowest.id, flowMetrics.slowest.title)
                : "Longest cycle"
            }
            color="warning"
            footnote={
              <>
                Needs focus above 167h code→prod —{" "}
                <MarketNote
                  href={LINEAR_B_BENCHMARKS}
                  title="LinearB 2025 marks cycle time above 167 hours, from code to production, as needs focus."
                >
                  LinearB 2025
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
      </StaggeredList>

      <StaggeredList className="grid items-stretch gap-4 grid-cols-2 md:grid-cols-4">
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Ready for dev"
            value={readyCount}
            icon={Gauge}
            description="Includes the former backlog"
            color="info"
            footnote={
              <>
                Unstarted stories stay ready. Enough for the sprint —{" "}
                <MarketNote
                  href={SCRUM_GUIDE}
                  title="Scrum Guide: the Sprint Backlog is the plan for the current Sprint. Stories that were backlog are counted here as ready for dev."
                >
                  Scrum Guide
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Backlog"
            value={backlogCount}
            icon={Gauge}
            description="Moved to ready for dev"
            color="primary"
            footnote={
              <>
                This queue stays empty by policy —{" "}
                <MarketNote
                  href={SCRUM_GUIDE}
                  title="Scrum Guide: the Product Backlog is an ordered list. In this dashboard those stories are shown as ready for dev, so this count stays at zero."
                >
                  Scrum Guide
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Blocked"
            value={blockedCount}
            icon={AlertTriangle}
            description={
              blockedCount > 0 ? "Attention required" : "No blockers"
            }
            color="destructive"
            footnote={
              <>
                Keep blockers at zero —{" "}
                <MarketNote
                  href={KANBAN_GUIDE}
                  title="Kanban Guide: visualize blocked work and limit work in progress. Zero blockers is a flow practice, not a surveyed percentile."
                >
                  Kanban Guide
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
        <StaggeredItem className="h-full">
          <StatsCard
            className={cardClass}
            title="Done"
            value={doneCount}
            icon={TrendingUp}
            description={`${totalStories} in active scope`}
            color="success"
            footnote={
              <>
                No market total. Sprint accuracy elite &gt;80% —{" "}
                <MarketNote
                  href={LINEAR_B_BENCHMARKS}
                  title="LinearB 2025 elite planning accuracy is above 80% of planned sprint work delivered. Cumulative done count has no cross-team benchmark."
                >
                  LinearB 2025
                </MarketNote>
              </>
            }
          />
        </StaggeredItem>
      </StaggeredList>
    </div>
  );
}
