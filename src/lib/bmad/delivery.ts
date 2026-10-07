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

type SprintLike = { id: string; title?: string; status: StoryStatus };
type StoryLike = { id: string; status: StoryStatus };

/**
 * Shared population for the headline Completed count and the Done card.
 * Sprint-status defines the scope. A matching story file can override status.
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
    .filter((story) => isActiveDeliveryStory(story))
    .map((story) =>
      promoteBacklogStatus(statusById.get(story.id) ?? story.status),
    );
}
