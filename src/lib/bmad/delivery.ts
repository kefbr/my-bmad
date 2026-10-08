import type { StoryStatus } from "./types";
import { isNonScopeStoryName } from "./utils";

export function promoteBacklogStatus(status: StoryStatus): StoryStatus {
  return status === "backlog" ? "ready-for-dev" : status;
}

export function isActiveDeliveryStory(story: {
  id: string;
  title?: string;
  status: StoryStatus;
}): boolean {
  return (
    story.status !== "cancelled" &&
    !isNonScopeStoryName(story.id) &&
    !isNonScopeStoryName(story.title ?? "")
  );
}

/** Cancelled on either side wins, so a withdrawn story cannot stay in a total. */
export function resolveDeliveryStatus(
  sprintStatus: StoryStatus | undefined,
  storyStatus: StoryStatus | undefined,
): StoryStatus {
  if (sprintStatus === "cancelled" || storyStatus === "cancelled") {
    return "cancelled";
  }
  return promoteBacklogStatus(storyStatus ?? sprintStatus ?? "backlog");
}

type SprintLike = { id: string; title?: string; status: StoryStatus };
type StoryLike = { id: string; status: StoryStatus };

/**
 * Shared population for the headline Completed count and the Done card.
 * Sprint-status defines the scope. A matching story file can override status,
 * except cancelled, which wins from either side and leaves the totals.
 * Backlog is presented as ready-for-dev.
 */
export function activeDeliveryStatuses(
  sprintStories: SprintLike[] | undefined,
  stories: StoryLike[],
): StoryStatus[] {
  const statusById = new Map(stories.map((story) => [story.id, story.status]));
  const source: SprintLike[] =
    sprintStories ??
    stories.map((story) => ({
      id: story.id,
      title: "",
      status: story.status,
    }));

  return source
    .map((story) => ({
      ...story,
      status: resolveDeliveryStatus(story.status, statusById.get(story.id)),
    }))
    .filter((story) => isActiveDeliveryStory(story))
    .map((story) => story.status);
}
