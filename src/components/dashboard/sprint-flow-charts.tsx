import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SprintFlowPoint } from "@/lib/bmad/types";
import { formatSprintDate } from "@/lib/bmad/sprint-plan";

interface Series {
  key: string;
  label: string;
  className: string;
  values: (number | null)[];
}

function formatHours(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function GroupedBars({
  points,
  series,
  format,
  ariaLabel,
}: {
  points: SprintFlowPoint[];
  series: Series[];
  format: (value: number) => string;
  ariaLabel: string;
}) {
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values.filter((v): v is number => v != null)),
  );

  return (
    <div>
      <div className="flex h-44 items-end gap-1" role="img" aria-label={ariaLabel}>
        {points.map((point, index) => {
          const tooltip = point.observed
            ? series
                .map((s) => {
                  const value = s.values[index];
                  return `${s.label}: ${value == null ? "—" : format(value)}`;
                })
                .join(" · ")
            : "Sem histórico";
          const head = series[0].values[index];
          return (
            <div
              key={point.number}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
              title={`Sprint ${point.number}${point.partial ? " (parcial)" : ""}: ${tooltip}`}
            >
              <span className="truncate text-center text-[10px] text-muted-foreground">
                {point.observed && head != null ? format(head) : ""}
              </span>
              <div className="relative flex h-28 w-full items-end justify-center gap-px">
                {point.observed ? (
                  series.map((s) => {
                    const value = s.values[index];
                    return (
                      <div
                        key={s.key}
                        data-series={s.key}
                        className={`min-w-0 flex-1 rounded-t ${s.className}`}
                        style={{
                          height: `${value ? Math.max((value / max) * 100, 3) : 0}%`,
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="h-full w-full rounded-t border border-dashed border-muted-foreground/25" />
                )}
              </div>
              <span className="text-center text-[10px] font-medium">
                S{point.number}
                {point.partial ? "*" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {series.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-1 text-[11px] text-muted-foreground"
          >
            <span className={`h-2 w-2 rounded-sm ${s.className}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SprintFlowChartsProps {
  points: SprintFlowPoint[];
  historyStartsAt?: string | null;
}

export function SprintFlowCharts({
  points,
  historyStartsAt,
}: SprintFlowChartsProps) {
  if (points.length === 0) return null;
  const historyDate = historyStartsAt
    ? new Date(historyStartsAt).toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      })
    : null;

  const charts: {
    title: string;
    caption: string;
    ariaLabel: string;
    format: (value: number) => string;
    series: Series[];
  }[] = [
    {
      title: "Velocity por sprint",
      caption:
        "Histórias que chegaram a done em cada sprint e o ritmo por semana decorrida da sprint.",
      ariaLabel: "Histórias concluídas e velocity semanal em cada sprint",
      format: formatCount,
      series: [
        {
          key: "completed",
          label: "Concluídas",
          className: "bg-primary",
          values: points.map((p) => (p.observed ? p.completed : null)),
        },
        {
          key: "velocity",
          label: "Velocity / semana",
          className: "bg-emerald-500",
          values: points.map((p) => p.velocityPerWeek),
        },
      ],
    },
    {
      title: "Cycle e lead time por sprint",
      caption:
        "Média das histórias concluídas na sprint. Cycle começa em in-progress; lead, na primeira aparição.",
      ariaLabel: "Cycle time e lead time médios em cada sprint",
      format: formatHours,
      series: [
        {
          key: "cycle",
          label: "Cycle time",
          className: "bg-sky-500",
          values: points.map((p) => p.averageCycleMs),
        },
        {
          key: "lead",
          label: "Lead time",
          className: "bg-violet-500",
          values: points.map((p) => p.averageLeadMs),
        },
      ],
    },
    {
      title: "WIP e bloqueios no fim da sprint",
      caption:
        "Histórias em in-progress ou review, e bloqueadas, na última revisão de cada sprint.",
      ariaLabel: "WIP e histórias bloqueadas no fim de cada sprint",
      format: formatCount,
      series: [
        {
          key: "wip",
          label: "WIP",
          className: "bg-amber-500",
          values: points.map((p) => p.wipAtEnd),
        },
        {
          key: "blocked",
          label: "Bloqueadas",
          className: "bg-red-500",
          values: points.map((p) => p.blockedAtEnd),
        },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-3">
        {charts.map((chart) => (
          <Card key={chart.title} className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupedBars
                points={points}
                series={chart.series}
                format={chart.format}
                ariaLabel={chart.ariaLabel}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {chart.caption}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Cada história conta na sprint em que chegou a done no histórico do
        sprint-status.yaml.
        {historyDate
          ? ` O histórico começa em ${formatSprintDate(historyDate)}; o que já estava done antes disso não entra.`
          : ""}{" "}
        * Sprint parcial: em andamento ou com histórico iniciado no meio. A
        tracejada indica sprint futura ou sem histórico.
      </p>
    </div>
  );
}
