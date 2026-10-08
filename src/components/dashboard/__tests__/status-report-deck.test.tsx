import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { StatusSlide } from "../status-report-deck";
import {
  consolidated,
  frentes,
  reportDate,
  slides,
} from "@/lib/status-report/content";

describe("Status report", () => {
  it("shows the official slide export for every page of the deck", () => {
    expect(reportDate).toBe("08/10/2026");
    expect(slides).toHaveLength(14);
    for (const slide of slides) {
      const file = path.join(
        process.cwd(),
        "public",
        slide.image.replace(/^\//, ""),
      );
      expect(existsSync(file), slide.image).toBe(true);
    }

    const html = renderToStaticMarkup(<StatusSlide slide={slides[2]} />);
    expect(html).toContain("slide-03.png");
    expect(html).toContain("Cronograma · Fase 1");
  });

  it("keeps the excel frente rows ready for the weekly update", () => {
    const funcional = frentes.find((frente) => frente.id === "funcional");
    expect(funcional?.sections[0].rows).toHaveLength(10);
    expect(funcional?.sections[0].rows[0].activity).toBe(
      "Construção de Documento de Produto",
    );
    expect(funcional?.sections[0].rows[9]).toMatchObject({
      done: "50,0%",
      planned: "42,0%",
    });

    const integracao = frentes.find((frente) => frente.id === "integracao");
    const integracaoRows = integracao?.sections.flatMap(
      (section) => section.rows,
    );
    expect(integracaoRows).toHaveLength(15);
    expect(integracao?.sections[0].title).toBe(
      "Geração de Ocorrências (ServiceNow)",
    );

    expect(consolidated.total).toEqual({ done: "54,8%", planned: "48,4%" });
    expect(consolidated.deviation.foursys).toBe("6,5%");
  });
});
