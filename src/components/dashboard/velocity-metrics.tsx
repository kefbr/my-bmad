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
import type { FlowMetrics, SprintStatus } from "@/lib/bmad/types";

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

  const stories = sprintStatus.stories.filter((s) => s.status !== "cancelled");
  const totalStories = stories.length;
  const doneCount = stories.filter((s) => s.status === "done").length;
  const wipCount = stories.filter(
    (s) => s.status === "in-progress" || s.status === "review",
  ).length;
  const blockedCount = stories.filter((s) => s.status === "blocked").length;
  const readyCount = stories.filter((s) => s.status === "ready-for-dev").length;
  const backlogCount = stories.filter((s) => s.status === "backlog").length;

  const sample = flowMetrics?.sampleSize ?? 0;
  const hasTiming = sample > 0;

  return (
    <div className="space-y-4">
      <StaggeredList className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <StaggeredItem>
          <StatsCard
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
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
            title="WIP"
            value={wipCount}
            icon={Activity}
            description="In progress + review"
            color="info"
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
            title="Throughput 7d"
            value={flowMetrics?.throughput7d ?? "—"}
            icon={Zap}
            description={
              flowMetrics
                ? "Stories finished last 7 days"
                : "Needs sprint history"
            }
            color="violet"
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
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
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
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
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
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
          />
        </StaggeredItem>
      </StaggeredList>

      <StaggeredList className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StaggeredItem>
          <StatsCard
            title="Ready for dev"
            value={readyCount}
            icon={Gauge}
            description="Queued for build"
            color="info"
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
            title="Backlog"
            value={backlogCount}
            icon={Gauge}
            description="Not started"
            color="primary"
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
            title="Blocked"
            value={blockedCount}
            icon={AlertTriangle}
            description={
              blockedCount > 0 ? "Attention required" : "No blockers"
            }
            color="destructive"
          />
        </StaggeredItem>
        <StaggeredItem>
          <StatsCard
            title="Done"
            value={doneCount}
            icon={TrendingUp}
            description={`${totalStories} in active scope`}
            color="success"
          />
        </StaggeredItem>
      </StaggeredList>
    </div>
  );
}
