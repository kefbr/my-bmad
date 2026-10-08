import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusSlide } from "../status-report-deck";
import deck from "@/lib/status-report/deck.json";

describe("Status report deck", () => {
  it("keeps the fourteen slides and the weekly date", () => {
    expect(deck.slides).toHaveLength(14);
    expect(deck.date).toBe("08/10/2026");
    const cover = renderToStaticMarkup(
      <StatusSlide slide={deck.slides[0]} />,
    );
    expect(cover).toContain("Cockpit de Monitoramento");
    expect(cover).toContain("#222239");
    expect(cover).toContain("08");
  });

  it("keeps the frente tables, including completed and planned percents", () => {
    const funcional = renderToStaticMarkup(
      <StatusSlide slide={deck.slides[7]} />,
    );
    expect(funcional).toContain("FRENTE FUNCIONAL");
    expect(funcional).toContain("Construção de Documento de Produto");
    expect(funcional).toContain("100%");

    const tecnologia = renderToStaticMarkup(
      <StatusSlide slide={deck.slides[8]} />,
    );
    expect(tecnologia).toContain("Desenho de Arquitetura Base Projeto (Foursys)");

    const integracao = renderToStaticMarkup(
      <StatusSlide slide={deck.slides[9]} />,
    );
    expect(integracao).toContain("PagerDuty, SMTP, Saviynt, ServiceNow");

    const consolidado = renderToStaticMarkup(
      <StatusSlide slide={deck.slides[10]} />,
    );
    expect(consolidado).toContain("STATUS DO PROJETO");
  });
});
