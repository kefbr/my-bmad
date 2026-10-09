import { describe, expect, it } from "vitest";
import type { SprintStoryEntry, StoryStatus } from "../types";
import {
  COCKPIT_PROJECT_ESTIMATE_END,
  COCKPIT_SPRINT_COUNT,
  buildCockpitSprints,
  cockpitSprintDefinitions,
  sprintNumberForStory,
  usesCockpitSprintPlan,
} from "../sprint-plan";

function story(
  id: string,
  status: StoryStatus,
  epicId = id.split(".")[0],
): SprintStoryEntry {
  return { id, title: id, status, epicId };
}

describe("cockpit sprint plan", () => {
  it("starts each sprint on Monday and ends it on Friday of the second week", () => {
    const sprints = cockpitSprintDefinitions();
    expect(sprints).toHaveLength(COCKPIT_SPRINT_COUNT);
    expect(sprints[0]).toMatchObject({
      number: 1,
      startDate: "2026-09-07",
      endDate: "2026-09-18",
    });
    expect(sprints[2]).toMatchObject({
      number: 3,
      startDate: "2026-10-05",
      endDate: "2026-10-16",
    });
    expect(sprints[10].startDate).toBe("2027-01-25");
    expect(sprints[10].endDate).toBe("2027-02-05");
    expect(sprints[10].startDate <= COCKPIT_PROJECT_ESTIMATE_END).toBe(true);
    expect(sprints[10].endDate >= COCKPIT_PROJECT_ESTIMATE_END).toBe(true);
  });

  it("places the known scope in the requested sprint", () => {
    expect(sprintNumberForStory("2.2")).toBe(1);
    expect(sprintNumberForStory("2.20")).toBe(1);
    expect(sprintNumberForStory("2.4")).toBe(2);
    expect(sprintNumberForStory("2.18")).toBe(2);
    expect(sprintNumberForStory("3.24")).toBe(3);
    expect(sprintNumberForStory("3.21")).toBe(3);
    expect(sprintNumberForStory("3.14")).toBe(4);
    expect(sprintNumberForStory("3.15")).toBe(4);
    expect(sprintNumberForStory("4.13")).toBe(4);
    expect(sprintNumberForStory("4.14")).toBe(4);
    expect(sprintNumberForStory("4.15")).toBe(4);
    expect(sprintNumberForStory("4.7")).toBe(4);
    expect(sprintNumberForStory("5.3")).toBe(4);
    expect(sprintNumberForStory("11.1")).toBe(6);
    expect(sprintNumberForStory("11.18")).toBe(6);
    expect(sprintNumberForStory("8.13")).toBe(5);
    expect(sprintNumberForStory("8.10")).toBe(5);
    expect(sprintNumberForStory("8.12")).toBe(6);
    expect(sprintNumberForStory("6.5")).toBe(7);
    expect(sprintNumberForStory("7.4")).toBe(8);
    expect(sprintNumberForStory("7.10")).toBe(8);
    expect(sprintNumberForStory("1.9")).toBe(9);
    expect(sprintNumberForStory("1.15")).toBe(9);
    expect(sprintNumberForStory("9.3")).toBe(10);
    expect(sprintNumberForStory("9.12")).toBe(10);
    expect(sprintNumberForStory("6.6")).toBe(11);
  });

  it("uses the project sprint_assignment instead of the built-in map", () => {
    const assignment = {
      epics: { "6": 7 },
      stories: {},
      unassignedSprint: 7,
    };
    const buckets = buildCockpitSprints(
      [story("6.6", "backlog"), story("10.1", "backlog", "10")],
      "2026-10-06",
      assignment,
    );

    expect(sprintNumberForStory("6.6", assignment)).toBe(7);
    expect(buckets[6].stories.map((item) => item.id)).toEqual(["6.6", "10.1"]);
    expect(buckets[10].stories).toEqual([]);
    expect(buckets[10].total).toBe(0);
  });

  it("keeps the current story status inside the assigned sprint", () => {
    const buckets = buildCockpitSprints(
      [
        story("2.2", "done"),
        story("3.24", "in-progress"),
        story("11.9", "backlog"),
        story("8.13", "review"),
        story("4.14", "blocked"),
      ],
      "2026-10-06",
    );

    expect(buckets[0].stories.map((item) => item.status)).toEqual(["done"]);
    expect(buckets[2].calendarState).toBe("current");
    expect(buckets[2].stories[0].status).toBe("in-progress");
    expect(buckets[5].stories[0]).toMatchObject({ id: "11.9", status: "backlog" });
    expect(buckets[4].stories[0].status).toBe("review");
    expect(buckets[3].stories[0].status).toBe("blocked");
    expect(buckets[0].percent).toBe(100);
    expect(buckets[2].percent).toBe(0);
  });

  it("drops review notes from sprint totals", () => {
    const buckets = buildCockpitSprints(
      [
        story("2.2", "done"),
        story("diff.3", "done"),
        story("diff.4", "done"),
        story("pr.3", "done"),
        story("pr.4", "done"),
        story("pr.99", "done"),
      ],
      "2026-10-06",
    );
    const listed = buckets.flatMap((bucket) => bucket.stories.map((item) => item.id));
    expect(listed).toEqual(["2.2"]);
    expect(buckets.reduce((sum, bucket) => sum + bucket.done, 0)).toBe(1);
  });

  it("does not let cancelled stories change the completion percent", () => {
    const buckets = buildCockpitSprints(
      [story("2.2", "done"), story("2.3", "cancelled")],
      "2026-10-06",
    );
    expect(buckets[0].total).toBe(1);
    expect(buckets[0].percent).toBe(100);
    expect(buckets[0].stories).toHaveLength(2);
  });

  it("recognizes the Cockpit project by name or by epic 11 plus catalog", () => {
    expect(
      usesCockpitSprintPlan({ owner: "kefbr", repo: "cockpit-new", stories: [] }),
    ).toBe(true);
    expect(
      usesCockpitSprintPlan({
        owner: "local",
        repo: "folder",
        stories: [{ epicId: "2" }, { epicId: "11" }],
      }),
    ).toBe(true);
    expect(
      usesCockpitSprintPlan({
        owner: "acme",
        repo: "other",
        stories: [{ epicId: "1" }],
      }),
    ).toBe(false);
  });
});
