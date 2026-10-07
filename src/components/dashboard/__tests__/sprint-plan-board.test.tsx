import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SprintPlanBoard } from "../sprint-plan-board";
import { buildCockpitSprints } from "@/lib/bmad/sprint-plan";

describe("SprintPlanBoard", () => {
  it("renders a line-by-line progress bar with its percentage", () => {
    const sprints = buildCockpitSprints(
      [
        {
          id: "2.2",
          title: "2-2-manter-areas",
          status: "done",
          epicId: "2",
        },
        {
          id: "2.3",
          title: "2-3-manter-contextos",
          status: "backlog",
          epicId: "2",
        },
      ],
      "2026-10-06",
    );

    const html = renderToStaticMarkup(
      <SprintPlanBoard sprints={sprints} epics={[]} />,
    );

    expect(html).toContain(">Progresso</th>");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Sprint 1: 50% concluída"');
    expect(html).toContain("width:50%");
    expect(html).toContain(">50%</span>");
  });
});
