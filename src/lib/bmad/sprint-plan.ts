import type { SprintStoryEntry, StoryStatus } from "./types";
import { isNonScopeStoryName } from "./utils";

/** Monday of sprint 1. The next sprint starts on the Monday two weeks later. */
export const COCKPIT_PROJECT_START = "2026-09-07";
/** Business estimate. It falls inside sprint 11, which runs through 05/02/2027. */
export const COCKPIT_PROJECT_ESTIMATE_END = "2027-01-31";
/** Days from one Monday start to the next. */
export const COCKPIT_SPRINT_LENGTH_DAYS = 14;
/** Monday through Friday of the second week, inclusive. */
export const COCKPIT_SPRINT_LAST_DAY_OFFSET = 11;
export const COCKPIT_SPRINT_COUNT = 11;

export interface SprintDefinition {
  number: number;
  goal: string;
  notes: string[];
  startDate: string;
  endDate: string;
}

export type SprintCalendarState = "upcoming" | "current" | "closed";

export interface SprintStoryGroup {
  epicId: string;
  stories: SprintStoryEntry[];
  done: number;
  total: number;
}

export interface SprintBucket {
  definition: SprintDefinition;
  calendarState: SprintCalendarState;
  stories: SprintStoryEntry[];
  groups: SprintStoryGroup[];
  /** Stories that count toward completion. Cancelled stories stay visible but out of this total. */
  total: number;
  done: number;
  percent: number;
  counts: Partial<Record<StoryStatus, number>>;
}

const SPRINT_GOALS: { goal: string; notes: string[] }[] = [
  {
    goal: "CRUDs de Áreas, Contextos, Tipos de Monitoramento e Conectores",
    notes: [],
  },
  {
    goal: "CRUDs de Tipos de Comunicação e Comunicações",
    notes: [
      "O envio por PagerDuty e as mensagens sistêmicas ficam na sprint 7.",
    ],
  },
  {
    goal: "Gestão de alertas: lista, detalhes, wizard, agenda e conector",
    notes: ["Não inclui o épico 11."],
  },
  {
    goal: "Motor de fases, F98 e F99, ativar/inativar, inibição, execução manual e auditoria",
    notes: [
      "Não inclui o épico 11.",
      "O recálculo de fase está na classificação do épico 4, não numa história com esse nome.",
    ],
  },
  {
    goal: "Tema claro/escuro, dashboard de observabilidade, ocorrências em CRUD e Watchdog",
    notes: [
      "Tema claro/escuro é o NFR26 e não tem história própria no sprint-status.",
      "Ainda não há história numerada só para o CRUD local de ocorrências. A integração ServiceNow está na sprint 8.",
    ],
  },
  {
    goal: "Dashboard executivo e o épico 11 inteiro",
    notes: ["Mudança de escopo dos alertas para Agrupadores."],
  },
  {
    goal: "PagerDuty e mensagens sistêmicas",
    notes: [
      "A contingência por e-mail (6.6) fica com as demais histórias do épico 6.",
    ],
  },
  {
    goal: "ServiceNow, espelho de status e SLA, lista filtrada de ocorrências",
    notes: [],
  },
  {
    goal: "Login e administração local de contas",
    notes: ["Perfis, roles e acesso por área ficam na sprint 10."],
  },
  {
    goal: "Perfis de acesso, roles e escopo por área",
    notes: [],
  },
  {
    goal: "Reservada para histórias ainda não definidas",
    notes: [
      "A estimativa do projeto fecha em 31/01/2027, ainda dentro desta sprint.",
      "Nenhuma história está associada por enquanto.",
    ],
  },
];

/** Stories that do not follow the epic default. */
const SPRINT_OVERRIDE: Record<string, number> = {
  "2.4": 2,
  "2.18": 2,
  "2.13": 4,
  "2.17": 4,
  "2.19": 4,
  "3.14": 4,
  "3.15": 4,
  "3.23": 4,
  "8.1B": 6,
  "8.2": 6,
  "8.7B": 8,
  "8.11B": 8,
  "8.12": 6,
  "8.13B": 6,
};

const EPIC_SPRINT: Record<string, number> = {
  "1": 9,
  "2": 1,
  "3": 3,
  "4": 4,
  "5": 4,
  "6": 7,
  "7": 8,
  "8": 5,
  "9": 10,
  "11": 6,
};

export function addUtcDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatSprintDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function cockpitSprintDefinitions(): SprintDefinition[] {
  return SPRINT_GOALS.map((item, index) => {
    const startDate = addUtcDays(
      COCKPIT_PROJECT_START,
      index * COCKPIT_SPRINT_LENGTH_DAYS,
    );
    return {
      number: index + 1,
      goal: item.goal,
      notes: item.notes,
      startDate,
      endDate: addUtcDays(startDate, COCKPIT_SPRINT_LAST_DAY_OFFSET),
    };
  });
}

export function sprintCalendarState(
  sprint: { startDate: string; endDate: string },
  today: string,
): SprintCalendarState {
  if (today < sprint.startDate) return "upcoming";
  if (today > sprint.endDate) return "closed";
  return "current";
}

/** Sprint that receives a story whose epic has no default. Sprint 11 stays empty until a story is assigned there. */
const UNASSIGNED_SPRINT = 7;

export function sprintNumberForStory(id: string): number {
  const override = SPRINT_OVERRIDE[id];
  if (override) return override;
  const epicId = id.split(".")[0] ?? "";
  return EPIC_SPRINT[epicId] ?? UNASSIGNED_SPRINT;
}

export function usesCockpitSprintPlan(input: {
  owner: string;
  repo: string;
  stories: { epicId?: string }[];
}): boolean {
  const slug = `${input.owner}/${input.repo}`.toLowerCase();
  if (slug.includes("cockpit")) return true;
  const epics = new Set(
    input.stories.map((story) => story.epicId).filter((id): id is string => !!id),
  );
  return epics.has("11") && (epics.has("1") || epics.has("2"));
}

function countsTowardCompletion(status: StoryStatus): boolean {
  return status !== "cancelled";
}

function compareEpicIds(a: string, b: string): number {
  const aNumber = Number(a);
  const bNumber = Number(b);
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber) && aNumber !== bNumber) {
    return aNumber - bNumber;
  }
  return a.localeCompare(b);
}

export function buildCockpitSprints(
  stories: SprintStoryEntry[],
  today: string,
): SprintBucket[] {
  const definitions = cockpitSprintDefinitions();
  const grouped = new Map<number, SprintStoryEntry[]>();
  for (const definition of definitions) grouped.set(definition.number, []);

  for (const story of stories) {
    if (isNonScopeStoryName(story.id) || isNonScopeStoryName(story.title)) {
      continue;
    }
    const number = sprintNumberForStory(story.id);
    const bucket = grouped.get(number) ?? grouped.get(UNASSIGNED_SPRINT)!;
    bucket.push(story);
  }

  return definitions.map((definition) => {
    const sprintStories = grouped.get(definition.number) ?? [];
    const counted = sprintStories.filter((story) =>
      countsTowardCompletion(story.status),
    );
    const done = counted.filter((story) => story.status === "done").length;
    const counts: Partial<Record<StoryStatus, number>> = {};
    for (const story of counted) {
      counts[story.status] = (counts[story.status] ?? 0) + 1;
    }

    const byEpic = new Map<string, SprintStoryEntry[]>();
    for (const story of sprintStories) {
      const epicId = story.epicId || "other";
      const list = byEpic.get(epicId) ?? [];
      list.push(story);
      byEpic.set(epicId, list);
    }

    const groups = [...byEpic.entries()]
      .sort((a, b) => compareEpicIds(a[0], b[0]))
      .map(([epicId, epicStories]) => {
        const active = epicStories.filter((story) =>
          countsTowardCompletion(story.status),
        );
        return {
          epicId,
          stories: epicStories,
          total: active.length,
          done: active.filter((story) => story.status === "done").length,
        };
      });

    return {
      definition,
      calendarState: sprintCalendarState(definition, today),
      stories: sprintStories,
      groups,
      total: counted.length,
      done,
      percent: counted.length > 0 ? Math.round((done / counted.length) * 100) : 0,
      counts,
    };
  });
}
