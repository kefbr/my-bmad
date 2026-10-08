import { describe, it, expect } from "vitest";
import { computeFlowMetrics } from "../compute-flow-metrics";
import type { FileRevision } from "@/lib/content-provider";

function rev(at: string, yaml: string): FileRevision {
  return { committedAt: at, content: yaml };
}

describe("computeFlowMetrics", () => {
  it("computes average cycle/lead and extremes from history", () => {
    const revisions = [
      rev(
        "2026-09-01T10:00:00.000Z",
        `
development_status:
  epic-1: in-progress
  1-1-fast: backlog
  1-2-slow: backlog
`,
      ),
      rev(
        "2026-09-01T12:00:00.000Z",
        `
development_status:
  epic-1: in-progress
  1-1-fast: in-progress
  1-2-slow: in-progress
`,
      ),
      rev(
        "2026-09-01T14:00:00.000Z",
        `
development_status:
  epic-1: in-progress
  1-1-fast: done
  1-2-slow: in-progress
`,
      ),
      rev(
        "2026-09-03T14:00:00.000Z",
        `
development_status:
  epic-1: done
  1-1-fast: done
  1-2-slow: done
`,
      ),
    ];

    const metrics = computeFlowMetrics(
      revisions,
      Date.parse("2026-09-03T15:00:00.000Z"),
    );

    expect(metrics.sampleSize).toBe(2);
    expect(metrics.fastest?.id).toBe("1.1");
    expect(metrics.slowest?.id).toBe("1.2");
    expect(metrics.averageCycleMs).toBe(
      Math.round(((2 + 50) * 3_600_000) / 2),
    );
    expect(metrics.throughput7d).toBe(2);
    expect(metrics.velocityPerWeek).not.toBeNull();
  });

  it("ignores cancelled stories and empty history", () => {
    expect(computeFlowMetrics([])).toMatchObject({ sampleSize: 0 });

    const metrics = computeFlowMetrics([
      rev(
        "2026-09-01T10:00:00.000Z",
        `
development_status:
  epic-10: cancelled
  10-1-import: cancelled
  1-1-ok: in-progress
`,
      ),
      rev(
        "2026-09-02T10:00:00.000Z",
        `
development_status:
  epic-10: cancelled
  10-1-import: cancelled
  1-1-ok: done
`,
      ),
    ]);

    expect(metrics.sampleSize).toBe(1);
    expect(metrics.fastest?.id).toBe("1.1");
  });

  it("parses lettered story keys", () => {
    const metrics = computeFlowMetrics([
      rev(
        "2026-09-01T08:00:00.000Z",
        `
development_status:
  3-16A-publicar: in-progress
`,
      ),
      rev(
        "2026-09-01T20:00:00.000Z",
        `
development_status:
  3-16A-publicar: done
`,
      ),
    ]);

    expect(metrics.sampleSize).toBe(1);
    expect(metrics.fastest?.id).toBe("3.16A");
    expect(metrics.averageCycleMs).toBe(12 * 3_600_000);
  });

  it("groups completions, timings and end-of-sprint WIP by sprint", () => {
    const sprints = [
      { number: 1, startDate: "2026-09-07", endDate: "2026-09-18" },
      { number: 2, startDate: "2026-09-21", endDate: "2026-10-02" },
      { number: 3, startDate: "2026-10-05", endDate: "2026-10-16" },
      { number: 4, startDate: "2026-10-19", endDate: "2026-10-30" },
    ];
    const revisions = [
      rev(
        "2026-09-17T13:00:00.000Z",
        `
development_status:
  1-1-old: done
  1-2-a: in-progress
  1-3-b: backlog
  1-4-c: blocked
`,
      ),
      // Saturday after sprint 1: still counts in sprint 1.
      rev(
        "2026-09-19T13:00:00.000Z",
        `
development_status:
  1-1-old: done
  1-2-a: done
  1-3-b: in-progress
  1-4-c: blocked
`,
      ),
      rev(
        "2026-09-23T13:00:00.000Z",
        `
development_status:
  1-1-old: done
  1-2-a: done
  1-3-b: done
  1-4-c: in-progress
`,
      ),
    ];

    const metrics = computeFlowMetrics(
      revisions,
      Date.parse("2026-10-06T15:00:00.000Z"),
      sprints,
    );
    const [s1, s2, s3, s4] = metrics.sprints!;

    expect(metrics.historyStartsAt).toBe("2026-09-17T13:00:00.000Z");
    expect(s1).toMatchObject({
      observed: true,
      partial: true,
      completed: 1,
      velocityPerWeek: 0.5,
      wipAtEnd: 1,
      blockedAtEnd: 1,
    });
    expect(s1.averageCycleMs).toBe(48 * 3_600_000);
    expect(s2).toMatchObject({
      observed: true,
      partial: false,
      completed: 1,
      velocityPerWeek: 0.5,
      wipAtEnd: 1,
      blockedAtEnd: 0,
    });
    expect(s3).toMatchObject({ observed: true, partial: true, completed: 0 });
    expect(s4).toMatchObject({ observed: false, completed: 0, wipAtEnd: null });
  });
});
