import type {
  ContentProvider,
  ContentProviderTree,
  FileRevision,
} from "./types";
import type { UserOctokit } from "@/lib/github/client";
import {
  getCachedUserRepoTree,
  getCachedUserRawContent,
  getCachedUserFileRevisions,
} from "@/lib/github/client";

export class GitHubProvider implements ContentProvider {
  constructor(
    private octokit: UserOctokit,
    private userId: string,
    private owner: string,
    private repo: string,
    private branch: string,
  ) {}

  async getTree(): Promise<ContentProviderTree> {
    const tree = await getCachedUserRepoTree(
      this.octokit,
      this.userId,
      this.owner,
      this.repo,
      this.branch,
    );

    const paths: string[] = [];
    const rootDirectories: string[] = [];

    for (const item of tree.tree) {
      if (item.type === "blob") {
        paths.push(item.path);
      } else if (item.type === "tree" && !item.path.includes("/")) {
        rootDirectories.push(item.path);
      }
    }

    return { paths, rootDirectories };
  }

  async getFileContent(filePath: string): Promise<string> {
    return getCachedUserRawContent(
      this.octokit,
      this.userId,
      this.owner,
      this.repo,
      this.branch,
      filePath,
    );
  }

  async getFileRevisions(
    filePath: string,
    limit: number,
  ): Promise<FileRevision[]> {
    return getCachedUserFileRevisions(
      this.octokit,
      this.userId,
      this.owner,
      this.repo,
      this.branch,
      filePath,
      limit,
    );
  }

  async validateRoot(): Promise<void> {
    // No-op: the repo exists if it's in the DB.
  }
}
