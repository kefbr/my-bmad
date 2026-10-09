export type StoryStatus =
  | "done"
  | "in-progress"
  | "review"
  | "blocked"
  | "ready-for-dev"
  | "backlog"
  | "cancelled"
  | "unknown";

export type EpicStatus = "done" | "in-progress" | "not-started";

export interface SprintStatus {
  sprint?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  stories: SprintStoryEntry[];
}

export interface SprintStoryEntry {
  id: string;
  title: string;
  status: StoryStatus;
  epicId?: string;
}

/** Story-to-sprint map declared by the project in sprint-status.yaml. */
export interface SprintAssignment {
  epics: Record<string, number>;
  stories: Record<string, number>;
  unassignedSprint: number;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: EpicStatus;
  stories: string[];
  totalStories: number;
  completedStories: number;
  progressPercent: number;
}

export interface StoryDetail {
  id: string;
  title: string;
  status: StoryStatus;
  /**
   * True when the story markdown declared a status explicitly (frontmatter
   * `status:` or a `Status:` line in the body). When false, `status` came
   * from the default fallback and sprint-status.yaml may override it.
   */
  statusExplicit?: boolean;
  epicId: string;
  epicTitle?: string;
  description: string;
  acceptanceCriteria: string[];
  tasks: StoryTask[];
  completedTasks: number;
  totalTasks: number;
}

export interface StoryTask {
  description: string;
  completed: boolean;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export type BmadFileMetadata = {
  status?: string;
  stepsCompleted?: string[];
  lastStep?: string | number;
  title?: string;
  completedAt?: string;
  workflowType?: string;
};

export type ParsedBmadFile = {
  contentType: "markdown" | "yaml" | "json" | "text";
  frontmatter: Record<string, unknown> | null;
  metadata: BmadFileMetadata | null;
  body: string;
  rawContent: string;
  parseError: string | null;
};

export interface ParseErrorEntry {
  file: string;
  error: string;
  contentType: string;
}

export interface ParseHealthReport {
  errors: ParseErrorEntry[];
  totalFiles: number;
  successfulFiles: number;
}

export interface StoryTiming {
  id: string;
  title: string;
  cycleMs: number;
  leadMs: number;
}

/** Agile flow numbers derived from sprint-status.yaml history. */
export interface FlowMetrics {
  /** Stories with both a start and a finish observed in history. */
  sampleSize: number;
  averageCycleMs: number | null;
  averageLeadMs: number | null;
  fastest: StoryTiming | null;
  slowest: StoryTiming | null;
  /** Stories that reached done in the last 7 days. */
  throughput7d: number;
  /** Observed completions divided by observed weeks of history. */
  velocityPerWeek: number | null;
  /** Per-sprint evolution. Present only when the project has a sprint calendar. */
  sprints?: SprintFlowPoint[];
  /** First sprint-status.yaml revision found in history (ISO). */
  historyStartsAt?: string | null;
}

export interface SprintFlowPoint {
  number: number;
  startDate: string;
  endDate: string;
  /** False for future sprints and for sprints that ended before history begins. */
  observed: boolean;
  /** True for the running sprint or when history begins inside the sprint. */
  partial: boolean;
  completed: number;
  velocityPerWeek: number | null;
  averageCycleMs: number | null;
  averageLeadMs: number | null;
  /** In-progress plus review stories at the last revision of the sprint. */
  wipAtEnd: number | null;
  blockedAtEnd: number | null;
}

export interface BmadProject {
  owner: string;
  repo: string;
  branch: string;
  displayName: string;
  sprintStatus: SprintStatus | null;
  /** Present when the project declares sprint_assignment in sprint-status.yaml. */
  sprintAssignment?: SprintAssignment | null;
  epics: Epic[];
  stories: StoryDetail[];
  fileTree: FileTreeNode[];
  bmadFiles: string[];
  docsTree: FileTreeNode[];
  docsFolderName: string | null;
  parseHealth?: ParseHealthReport;
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  progressPercent: number;
  flowMetrics?: FlowMetrics | null;
}
