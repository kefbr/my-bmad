import { describe, it, expect } from "vitest";
import { correlate } from "../correlate";
import type { StoryDetail, Epic, SprintStatus } from "../types";

function makeStory(overrides: Partial<StoryDetail> = {}): StoryDetail {
  return {
    id: "1.1",
    title: "Test Story",
    status: "backlog",
    epicId: "1",
    description: "",
    acceptanceCriteria: [],
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    ...overrides,
  };
}

function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: "1",
    title: "Test Epic",
    description: "",
    status: "not-started",
    stories: ["1.1"],
    totalStories: 1,
    completedStories: 0,
    progressPercent: 0,
    ...overrides,
  };
}

describe("correlate", () => {
  it("does not mutate the input stories array", () => {
    const stories = [makeStory({ id: "1.1", status: "backlog" })];
    const epics = [makeEpic()];
    const sprint: SprintStatus = {
      stories: [{ id: "1.1", title: "1-1-test", status: "done", epicId: "1" }],
    };

    const originalStatus = stories[0].status;
    correlate(sprint, epics, stories);

    // The original story should NOT be mutated
    expect(stories[0].status).toBe(originalStatus);
  });

  it("returns stories unchanged when sprintStatus is null", () => {
    const stories = [makeStory({ id: "1.1", status: "backlog" })];
    const epics = [makeEpic()];
    const result = correlate(null, epics, stories);

    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].status).toBe("backlog");
  });

  it("markdown status wins over sprint-status when statusExplicit is true", () => {
    const stories = [
      makeStory({ id: "1.1", status: "in-progress", statusExplicit: true }),
    ];
    const epics = [makeEpic()];
    const sprint: SprintStatus = {
      stories: [{ id: "1.1", title: "1-1-test", status: "done", epicId: "1" }],
    };

    const result = correlate(sprint, epics, stories);
    expect(result.stories[0].status).toBe("in-progress");
  });

  it("sprint-status fills in when story has no explicit status (back-compat)", () => {
    const stories = [
      makeStory({ id: "1.1", status: "backlog" /* statusExplicit undefined */ }),
    ];
    const epics = [makeEpic()];
    const sprint: SprintStatus = {
      stories: [{ id: "1.1", title: "1-1-test", status: "done", epicId: "1" }],
    };

    const result = correlate(sprint, epics, stories);
    expect(result.stories[0].status).toBe("done");
  });

  it("creates stub for story only in sprint status", () => {
    const stories: StoryDetail[] = [];
    const epics = [makeEpic({ stories: ["2.1"] })];
    const sprint: SprintStatus = {
      stories: [
        { id: "2.1", title: "2-1-new-feature", status: "in-progress", epicId: "2" },
      ],
    };

    const result = correlate(sprint, epics, stories);
    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].id).toBe("2.1");
    expect(result.stories[0].status).toBe("in-progress");
    expect(result.stories[0].title).toBe("New Feature");
  });

  describe("progressPercent calculation", () => {
    it("returns 0% when no stories are done", () => {
      const stories = [
        makeStory({ id: "1.1", status: "backlog" }),
        makeStory({ id: "1.2", status: "in-progress" }),
        makeStory({ id: "1.3", status: "blocked" }),
      ];
      const epics = [makeEpic({ stories: ["1.1", "1.2", "1.3"] })];
      const result = correlate(null, epics, stories);

      expect(result.epics[0].progressPercent).toBe(0);
      expect(result.epics[0].status).toBe("in-progress");
    });

    it("returns 33% when 1 of 3 stories done", () => {
      const stories = [
        makeStory({ id: "1.1", status: "done" }),
        makeStory({ id: "1.2", status: "backlog" }),
        makeStory({ id: "1.3", status: "backlog" }),
      ];
      const epics = [makeEpic({ stories: ["1.1", "1.2", "1.3"] })];
      const result = correlate(null, epics, stories);

      expect(result.epics[0].progressPercent).toBe(33);
    });

    it("returns 100% when all stories done", () => {
      const stories = [
        makeStory({ id: "1.1", status: "done" }),
        makeStory({ id: "1.2", status: "done" }),
      ];
      const epics = [makeEpic({ stories: ["1.1", "1.2"] })];
      const result = correlate(null, epics, stories);

      expect(result.epics[0].progressPercent).toBe(100);
      expect(result.epics[0].status).toBe("done");
    });
  });

  it("assigns epicTitle to stories from enriched epics", () => {
    const stories = [makeStory({ id: "1.1", epicId: "1" })];
    const epics = [makeEpic({ id: "1", title: "My Epic" })];
    const result = correlate(null, epics, stories);

    expect(result.stories[0].epicTitle).toBe("My Epic");
  });

  it("computed epic status wins over sprint-status epicStatuses when stories exist", () => {
    // Stories say "in-progress" → sprint-status says "done" → computed wins.
    const stories = [makeStory({ id: "1.1", status: "in-progress" })];
    const epics = [makeEpic()];
    const epicStatuses = [{ id: "1", status: "done" as const }];

    const result = correlate(null, epics, stories, epicStatuses);
    expect(result.epics[0].status).toBe("in-progress");
  });

  it("falls back to sprint-status epicStatuses when epic has no stories", () => {
    const stories: StoryDetail[] = [];
    const epics = [makeEpic({ stories: [] })];
    const epicStatuses = [{ id: "1", status: "done" as const }];

    const result = correlate(null, epics, stories, epicStatuses);
    expect(result.epics[0].status).toBe("done");
  });

  it("backfills alphanumeric story epicId from explicit epic story references", () => {
    const stories = [
      makeStory({ id: "di.1", epicId: "di", status: "done" }),
    ];
    const epics = [
      makeEpic({
        id: "devops-infra",
        title: "Pipeline Quality",
        stories: ["di.1"],
      }),
    ];

    const result = correlate(null, epics, stories);

    expect(result.stories[0].epicId).toBe("devops-infra");
    expect(result.stories[0].epicTitle).toBe("Pipeline Quality");
    expect(result.epics[0].totalStories).toBe(1);
    expect(result.epics[0].completedStories).toBe(1);
  });

  it("drops cancelled epic stories from the total and the percent", () => {
    const stories = [
      makeStory({ id: "8.1", epicId: "8", status: "done", statusExplicit: true }),
      makeStory({ id: "8.2", epicId: "8", status: "done", statusExplicit: true }),
      makeStory({ id: "8.3", epicId: "8", status: "done", statusExplicit: true }),
      makeStory({ id: "8.4", epicId: "8", status: "backlog" }),
    ];
    const epics = [
      makeEpic({
        id: "8",
        stories: ["8.1", "8.2", "8.3", "8.4"],
      }),
    ];
    const sprint: SprintStatus = {
      stories: [
        { id: "8.1", title: "8-1-keep", status: "done", epicId: "8" },
        { id: "8.2", title: "8-2-withdrawn", status: "cancelled", epicId: "8" },
        { id: "8.3", title: "8-3-withdrawn", status: "cancelled", epicId: "8" },
        { id: "8.4", title: "8-4-open", status: "backlog", epicId: "8" },
      ],
    };

    const result = correlate(sprint, epics, stories);
    const epic = result.epics[0];

    expect(result.stories.find((story) => story.id === "8.2")?.status).toBe(
      "cancelled",
    );
    expect(result.stories.find((story) => story.id === "8.3")?.status).toBe(
      "cancelled",
    );
    expect(epic.totalStories).toBe(2);
    expect(epic.completedStories).toBe(1);
    expect(epic.progressPercent).toBe(50);
  });

  it("keeps a markdown cancellation out of the epic even when sprint says done", () => {
    const stories = [
      makeStory({
        id: "8.2",
        epicId: "8",
        status: "cancelled",
        statusExplicit: true,
      }),
      makeStory({ id: "8.4", epicId: "8", status: "done" }),
    ];
    const epics = [makeEpic({ id: "8", stories: ["8.2", "8.4"] })];
    const sprint: SprintStatus = {
      stories: [
        { id: "8.2", title: "8-2-withdrawn", status: "done", epicId: "8" },
        { id: "8.4", title: "8-4-open", status: "done", epicId: "8" },
      ],
    };

    const result = correlate(sprint, epics, stories);

    expect(result.epics[0].totalStories).toBe(1);
    expect(result.epics[0].completedStories).toBe(1);
    expect(result.epics[0].progressPercent).toBe(100);
  });

  it("does not count stories that another epic body only cites", () => {
    const stories = [
      makeStory({ id: "8.4", epicId: "8", status: "done" }),
      makeStory({ id: "8.5", epicId: "8", status: "done" }),
      makeStory({ id: "9.1", epicId: "9", status: "backlog" }),
      makeStory({ id: "11.4", epicId: "11", status: "backlog" }),
      makeStory({ id: "11.10", epicId: "11", status: "done" }),
    ];
    const epics = [
      makeEpic({ id: "8", stories: ["8.4", "11.4"] }),
      makeEpic({ id: "9", stories: ["9.1", "11.10"] }),
      makeEpic({ id: "11", stories: [] }),
    ];

    const result = correlate(null, epics, stories);
    const byId = new Map(result.epics.map((epic) => [epic.id, epic]));

    expect(byId.get("8")?.totalStories).toBe(2);
    expect(byId.get("8")?.progressPercent).toBe(100);
    expect(byId.get("9")?.totalStories).toBe(1);
    expect(byId.get("9")?.completedStories).toBe(0);
    expect(byId.get("11")?.totalStories).toBe(2);
    expect(byId.get("11")?.completedStories).toBe(1);
  });

  it("keeps story files that are not explicitly listed in an epic body", () => {
    const stories = [
      makeStory({ id: "4.1", epicId: "4", status: "done" }),
    ];
    const epics = [
      makeEpic({ id: "4", stories: [] }),
    ];

    const result = correlate(null, epics, stories);

    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].id).toBe("4.1");
    expect(result.epics[0].totalStories).toBe(1);
  });
});
