import { describe, expect, it } from "vitest";
import type { ContentProvider } from "@/lib/content-provider";
import type { RepoConfig } from "@/lib/types";
import { getBmadProject } from "../parser";

const REPO: RepoConfig = {
  owner: "kefbr",
  name: "cockpit-new",
  branch: "dev",
  displayName: "Cockpit",
  description: null,
  sourceType: "local",
  localPath: "/tmp/cockpit",
  lastSyncedAt: null,
};

function provider(files: Record<string, string>): ContentProvider {
  return {
    async getTree() {
      return { paths: Object.keys(files), rootDirectories: ["_bmad-output"] };
    },
    async getFileContent(path: string) {
      if (!(path in files)) throw new Error(`Not found: ${path}`);
      return files[path];
    },
    async validateRoot() {},
  };
}

describe("getBmadProject cancelled stories", () => {
  it("keeps two cancelled epic 8 stories out of the epic and the project totals", async () => {
    const project = await getBmadProject(
      REPO,
      provider({
        "_bmad-output/planning-artifacts/epics.md": [
          "## Epic 8: Operations",
          "- Story 8.1 - Keep",
          "- Story 8.2 - Withdrawn file",
          "- Story 8.3 - Withdrawn sprint",
          "- Story 8.4 - Open",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/sprint-status.yaml": [
          "development_status:",
          "  epic-8: in-progress",
          "  8-1-keep: done",
          "  8-2-withdrawn-file: done",
          "  8-3-withdrawn-sprint: cancelled",
          "  8-4-open: backlog",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/8-1-keep.md": [
          "# Keep",
          "Status: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/8-2-withdrawn-file.md": [
          "# Withdrawn file",
          "Status: cancelado",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/8-3-withdrawn-sprint.md": [
          "# Withdrawn sprint",
          "Status: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/8-4-open.md": [
          "# Open",
          "Status: backlog",
        ].join("\n"),
      }),
    );

    expect(project).not.toBeNull();
    const epic = project!.epics.find((item) => item.id === "8");
    expect(epic?.totalStories).toBe(2);
    expect(epic?.completedStories).toBe(1);
    expect(epic?.progressPercent).toBe(50);
    expect(project!.stories.map((story) => story.id).sort()).toEqual([
      "8.1",
      "8.4",
    ]);
    expect(project!.totalStories).toBe(2);
    expect(project!.completedStories).toBe(1);
    expect(project!.progressPercent).toBe(50);
    expect(
      project!.sprintStatus?.stories.find((story) => story.id === "8.3")
        ?.status,
    ).toBe("cancelled");
  });
});
