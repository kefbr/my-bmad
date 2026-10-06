import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Epic } from "@/lib/bmad/types";
import type { SprintBucket, SprintCalendarState } from "@/lib/bmad/sprint-plan";
import {
  COCKPIT_PROJECT_ESTIMATE_END,
  formatSprintDate,
} from "@/lib/bmad/sprint-plan";
import type { StoryStatus } from "@/lib/bmad/types";

const STATUS_SEGMENTS: { status: StoryStatus; className: string; label: string }[] = [
  { status: "done", className: "bg-emerald-500", label: "Done" },
  { status: "review", className: "bg-amber-500", label: "Review" },
  { status: "in-progress", className: "bg-sky-500", label: "In progress" },
  { status: "blocked", className: "bg-red-500", label: "Blocked" },
  { status: "ready-for-dev", className: "bg-violet-500", label: "Ready" },
  { status: "backlog", className: "bg-muted-foreground/30", label: "Backlog" },
  { status: "unknown", className: "bg-muted-foreground/60", label: "Unknown" },
];

const CALENDAR_LABEL: Record<SprintCalendarState, string> = {
  closed: "Encerrada",
  current: "Atual",
  upcoming: "Futura",
};

function humanizeTitle(title: string): string {
  return title
    .replace(/^(?:\d+-\d+[A-Za-z]?-|(?:[a-z][a-z0-9_-]*)-\d+-)/i, "")
    .replace(/-/g, " ");
}

interface SprintPlanBoardProps {
  sprints: SprintBucket[];
  epics: Epic[];
}

export function SprintPlanBoard({ sprints, epics }: SprintPlanBoardProps) {
  const epicTitle = new Map(epics.map((epic) => [epic.id, epic.title]));
  const maxTotal = Math.max(1, ...sprints.map((sprint) => sprint.total));
  const current = sprints.find((sprint) => sprint.calendarState === "current");
  const doneStories = sprints.reduce((sum, sprint) => sum + sprint.done, 0);
  const totalStories = sprints.reduce((sum, sprint) => sum + sprint.total, 0);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Sprints</h2>
        <p className="text-sm text-muted-foreground">
          Onze sprints a partir de 07/09/2026. Cada uma começa na segunda e
          termina na sexta da segunda semana. A estimativa do
          projeto fecha em {formatSprintDate(COCKPIT_PROJECT_ESTIMATE_END)}, dentro
          da sprint 11. Os status são os do sprint-status.yaml agora, não a data
          em que cada história foi concluída.
          {current
            ? ` Sprint atual: ${current.definition.number} (${formatSprintDate(current.definition.startDate)}–${formatSprintDate(current.definition.endDate)}).`
            : ""}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Conclusão por sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-44 items-end gap-1.5"
              role="img"
              aria-label="Percentual de histórias concluídas em cada sprint"
            >
              {sprints.map((sprint) => (
                <div
                  key={sprint.definition.number}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
                  title={`Sprint ${sprint.definition.number}: ${sprint.percent}% (${sprint.done}/${sprint.total})`}
                >
                  <span className="text-center text-[10px] text-muted-foreground">
                    {sprint.percent}%
                  </span>
                  <div className="relative h-28 w-full">
                    <div
                      className={
                        sprint.calendarState === "current"
                          ? "absolute inset-x-0 bottom-0 rounded-t bg-primary"
                          : sprint.calendarState === "closed"
                            ? "absolute inset-x-0 bottom-0 rounded-t bg-emerald-500/80"
                            : "absolute inset-x-0 bottom-0 rounded-t bg-muted-foreground/35"
                      }
                      style={{
                        height: `${Math.max(sprint.percent, sprint.total > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-center text-[10px] font-medium">
                    S{sprint.definition.number}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {doneStories}/{totalStories} histórias concluídas no plano. A barra
              destacada é a sprint do calendário.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Composição por status</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-44 items-end gap-1.5"
              role="img"
              aria-label="Quantidade de histórias por status em cada sprint"
            >
              {sprints.map((sprint) => (
                <div
                  key={sprint.definition.number}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`Sprint ${sprint.definition.number}: ${sprint.total} histórias`}
                >
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t"
                    style={{ height: `${(sprint.total / maxTotal) * 112}px` }}
                  >
                    {STATUS_SEGMENTS.map((segment) => {
                      const count = sprint.counts[segment.status] ?? 0;
                      if (count === 0) return null;
                      return (
                        <div
                          key={segment.status}
                          className={segment.className}
                          style={{ height: `${(count / sprint.total) * 100}%` }}
                        />
                      );
                    })}
                  </div>
                  <span className="mt-1 text-center text-[10px] font-medium">
                    S{sprint.definition.number}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {STATUS_SEGMENTS.map((segment) => (
                <span
                  key={segment.status}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground"
                >
                  <span className={`h-2 w-2 rounded-sm ${segment.className}`} />
                  {segment.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Sprint</th>
              <th className="px-3 py-2 font-medium">Período</th>
              <th className="px-3 py-2 font-medium">Calendário</th>
              <th className="px-3 py-2 font-medium">Concluídas</th>
              <th className="px-3 py-2 font-medium">Escopo</th>
            </tr>
          </thead>
          <tbody>
            {sprints.map((sprint) => (
              <tr
                key={sprint.definition.number}
                className={
                  sprint.calendarState === "current" ? "bg-primary/5" : undefined
                }
              >
                <td className="px-3 py-2 align-top font-medium">
                  {sprint.definition.number}
                </td>
                <td className="px-3 py-2 align-top whitespace-nowrap text-muted-foreground">
                  {formatSprintDate(sprint.definition.startDate)} –{" "}
                  {formatSprintDate(sprint.definition.endDate)}
                </td>
                <td className="px-3 py-2 align-top">
                  {CALENDAR_LABEL[sprint.calendarState]}
                </td>
                <td className="px-3 py-2 align-top whitespace-nowrap">
                  {sprint.done}/{sprint.total}
                  <span className="ml-1 text-muted-foreground">
                    ({sprint.percent}%)
                  </span>
                </td>
                <td className="px-3 py-2 align-top">
                  <p>{sprint.definition.goal}</p>
                  {sprint.definition.notes.length > 0 && (
                    <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                      {sprint.definition.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        {sprints.map((sprint) => (
          <details
            key={sprint.definition.number}
            className="rounded-xl border px-4 py-3"
            open={sprint.calendarState === "current"}
          >
            <summary className="cursor-pointer text-sm font-medium">
              Sprint {sprint.definition.number}: {sprint.done}/{sprint.total}{" "}
              concluídas · {sprint.definition.goal}
            </summary>
            <div className="mt-3 space-y-3">
              {sprint.groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma história numerada neste escopo.
                </p>
              ) : (
                sprint.groups.map((group) => (
                  <div key={group.epicId} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Épico {group.epicId}
                      {epicTitle.get(group.epicId)
                        ? ` · ${epicTitle.get(group.epicId)}`
                        : ""}{" "}
                      · {group.done}/{group.total}
                    </p>
                    <ul className="space-y-1">
                      {group.stories.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <span>
                            <span className="font-medium">{item.id}</span>{" "}
                            <span className="text-muted-foreground">
                              {humanizeTitle(item.title)}
                            </span>
                          </span>
                          <StatusBadge status={item.status} compact />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
