"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { slides } from "@/lib/status-report/content";
import type { SlideRef } from "@/lib/status-report/content";
import { Button } from "@/components/ui/button";

export function StatusSlide({ slide }: { slide: SlideRef }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-[#222239]"
      style={{ aspectRatio: "16 / 9" }}
    >
      <Image
        src={slide.image}
        alt={`Slide ${slide.number}: ${slide.title}`}
        width={1920}
        height={1080}
        unoptimized
        priority={slide.number === 1}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export function StatusReportDeck() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
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
