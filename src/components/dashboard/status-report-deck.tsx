"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import deck from "@/lib/status-report/deck.json";
import { Button } from "@/components/ui/button";

interface Run {
  t?: string;
  br?: boolean;
  sz?: number;
  b?: boolean;
  color?: string;
}

interface Paragraph {
  align: string;
  runs: Run[];
}

interface SlideShape {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  rot?: number;
  anchor?: string;
  image?: string;
  fit?: string;
  text?: Paragraph[];
}

interface Slide {
  number: number;
  title: string;
  shapes: SlideShape[];
}

const slides = deck.slides as Slide[];

const ALIGN: Record<string, "left" | "center" | "right" | "justify"> = {
  l: "left",
  ctr: "center",
  r: "right",
  just: "justify",
};

function justify(anchor?: string): "flex-start" | "center" | "flex-end" {
  if (anchor === "ctr") return "center";
  if (anchor === "b") return "flex-end";
  return "flex-start";
}

export function StatusSlide({ slide }: { slide: Slide }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-[#222239]"
      style={{ aspectRatio: "16 / 9", containerType: "size" }}
      aria-label={`Slide ${slide.number}: ${slide.title}`}
    >
      {slide.shapes.map((shape, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.w}%`,
            height: `${shape.h}%`,
            background: shape.fill,
            transform: shape.rot ? `rotate(${shape.rot}deg)` : undefined,
            display: shape.text ? "flex" : undefined,
            flexDirection: "column",
            justifyContent: justify(shape.anchor),
            overflow: shape.fill ? "hidden" : "visible",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1.05,
          }}
        >
          {shape.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shape.image}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: shape.fit === "cover" ? "cover" : "contain",
              }}
            />
          )}
          {shape.text?.map((paragraph, paragraphIndex) => (
            <p
              key={paragraphIndex}
              style={{
                margin: 0,
                textAlign: ALIGN[paragraph.align] ?? "left",
                whiteSpace: "pre-wrap",
              }}
            >
              {paragraph.runs.map((run, runIndex) =>
                run.br ? (
                  <br key={runIndex} />
                ) : (
                  <span
                    key={runIndex}
                    style={{
                      fontSize: `calc(${run.sz ?? 1200} / 540 * 1cqh)`,
                      fontWeight: run.b ? 700 : 400,
                      color: run.color,
                    }}
                  >
                    {run.t}
                  </span>
                ),
              )}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatusReportDeck() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(slides.length - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-4">
      <StatusSlide slide={slide} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Slide anterior"
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próximo slide"
          disabled={index === slides.length - 1}
          onClick={() =>
            setIndex((current) => Math.min(slides.length - 1, current + 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          {slide.number} / {slides.length} · {slide.title}
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {slides.map((item, itemIndex) => (
          <button
            key={item.number}
            type="button"
            onClick={() => setIndex(itemIndex)}
            aria-current={itemIndex === index ? "true" : undefined}
            className={
              itemIndex === index
                ? "shrink-0 rounded-md border border-primary bg-accent px-3 py-1.5 text-left text-xs font-medium text-accent-foreground"
                : "shrink-0 rounded-md border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
            }
          >
            {item.number}. {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
