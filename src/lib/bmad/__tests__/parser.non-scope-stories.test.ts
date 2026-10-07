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

describe("getBmadProject non-scope artifacts", () => {
  it("keeps the completed total aligned with sprint-status and drops diff/pr/spec notes", async () => {
    const project = await getBmadProject(
      REPO,
      provider({
        "_bmad-output/planning-artifacts/epics.md": [
          "## Epic 1: Access",
          "- Story 1.1 - Login",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/sprint-status.yaml": [
          "development_status:",
          "  epic-1: in-progress",
          "  1-1-login: done",
          "  diff-3-condensado: done",
          "  pr-99-scratch: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/1-1-login.md": [
          "# Login",
          "Status: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/diff-3-condensado.md": [
          "# Diff condensado",
          "Status: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/diff-4-review.md": [
          "not a heading",
          "Status: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/pr-3-draft.md": "Status: done",
        "_bmad-output/implementation-artifacts/pr-4-description.md": "Status: done",
        "_bmad-output/implementation-artifacts/pr-99-scratch.md": "Status: done",
        "_bmad-output/implementation-artifacts/spec-1-1-login.md": [
          "# Spec",
          "Status: done",
        ].join("\n"),
      }),
    );

    expect(project).not.toBeNull();
    expect(project!.stories.map((story) => story.id)).toEqual(["1.1"]);
    expect(project!.completedStories).toBe(1);
    expect(project!.totalStories).toBe(1);
    expect(
      project!.sprintStatus?.stories.filter((story) => story.status === "done"),
    ).toHaveLength(1);
  });

  it("matches completed with sprint done and promotes backlog to ready for dev", async () => {
    const project = await getBmadProject(
      REPO,
      provider({
        "_bmad-output/planning-artifacts/epics.md": [
          "## Epic 1: Access",
          "- Story 1.1 - Login",
          "- Story 1.2 - Roles",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/sprint-status.yaml": [
          "development_status:",
          "  epic-1: in-progress",
          "  1-1-login: done",
          "  1-2-roles: backlog",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/1-1-login.md": [
          "# Login",
          "Status: done",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/1-2-roles.md": [
          "# Roles",
          "Status: backlog",
        ].join("\n"),
        "_bmad-output/implementation-artifacts/9-9-orphan.md": [
          "# Orphan",
          "Status: done",
        ].join("\n"),
      }),
    );

    expect(project).not.toBeNull();
    expect(project!.completedStories).toBe(1);
    expect(project!.totalStories).toBe(2);
    expect(
      project!.sprintStatus?.stories.filter((story) => story.status === "done"),
    ).toHaveLength(1);
    expect(project!.stories.find((story) => story.id === "1.2")?.status).toBe(
      "ready-for-dev",
    );
    expect(
      project!.sprintStatus?.stories.find((story) => story.id === "1.2")
        ?.status,
    ).toBe("ready-for-dev");
    expect(project!.stories.some((story) => story.id === "9.9")).toBe(true);
  });
});
