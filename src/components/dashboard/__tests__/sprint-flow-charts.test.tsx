import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SprintFlowCharts } from "../sprint-flow-charts";
import type { SprintFlowPoint } from "@/lib/bmad/types";

const observed: SprintFlowPoint = {
  number: 2,
  startDate: "2026-09-21",
  endDate: "2026-10-02",
  observed: true,
  partial: false,
  completed: 6,
  velocityPerWeek: 3,
  averageCycleMs: 10 * 3_600_000,
  averageLeadMs: 72 * 3_600_000,
  wipAtEnd: 2,
  blockedAtEnd: 0,
};

const future: SprintFlowPoint = {
  number: 3,
  startDate: "2026-10-05",
  endDate: "2026-10-16",
  observed: false,
  partial: false,
  completed: 0,
  velocityPerWeek: null,
  averageCycleMs: null,
  averageLeadMs: null,
  wipAtEnd: null,
  blockedAtEnd: null,
};

describe("SprintFlowCharts", () => {
  it("renders velocity, timing and WIP evolution per sprint", () => {
    const html = renderToStaticMarkup(
      <SprintFlowCharts
        points={[observed, future]}
        historyStartsAt="2026-09-17T13:32:02.000Z"
      />,
    );

    expect(html).toContain("Velocity por sprint");
    expect(html).toContain("Cycle e lead time por sprint");
    expect(html).toContain("WIP e bloqueios no fim da sprint");
    expect(html).toContain("Sprint 2: Concluídas: 6 · Velocity / semana: 3");
    expect(html).toContain("Cycle time: 10h · Lead time: 3.0d");
    expect(html).toContain("Sprint 3: Sem histórico");
    expect(html).toContain("O histórico começa em 17/09/2026");
  });

  it("renders nothing without sprint points", () => {
    expect(renderToStaticMarkup(<SprintFlowCharts points={[]} />)).toBe("");
  });
});
