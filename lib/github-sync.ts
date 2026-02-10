import type { Octokit } from "@octokit/rest";
import type { Issue, GithubState } from "@/lib/types/actions";
import { prisma } from "@/lib/db";
import { parseGitHubRepo } from "@/lib/github";
import { logActivity } from "@/lib/utils/issue-activity";

function buildGitHubLabels(issue: Issue): string[] {
  const labels: string[] = [];
  labels.push(`type:${issue.type.toLowerCase()}`);
  labels.push(`priority:${issue.priority.toLowerCase()}`);
  labels.push(...issue.labels);
  return labels;
}

export async function pushIssuesToGitHub(
  projectId: string,
  githubRepo: string,
  octokit: Octokit,
): Promise<{ created: number; errors: string[] }> {
  const { owner, repo } = parseGitHubRepo(githubRepo);
  const errors: string[] = [];
  let created = 0;

  const unsyncedIssues = await prisma.issue.findMany({
    where: { projectId, githubIssueNumber: null },
    orderBy: { createdAt: "asc" },
  });

  for (const issue of unsyncedIssues) {
    try {
      const response = await octokit.rest.issues.create({
        owner,
        repo,
        title: issue.title,
        body: issue.description || "",
        labels: buildGitHubLabels(issue),
      });

      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          githubIssueNumber: response.data.number,
          githubState: "OPEN",
        },
      });

      await logActivity(
        issue.id,
        "SYNCED",
        "githubIssueNumber",
        null,
        String(response.data.number),
      );

      created++;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Failed to create GitHub issue for "${issue.title}": ${message}`);
    }
  }

  return { created, errors };
}

export async function pullIssuesFromGitHub(
  projectId: string,
  githubRepo: string,
  octokit: Octokit,
): Promise<{ updated: number; errors: string[] }> {
  const { owner, repo } = parseGitHubRepo(githubRepo);
  const errors: string[] = [];
  let updated = 0;

  const syncedIssues = await prisma.issue.findMany({
    where: { projectId, githubIssueNumber: { not: null } },
  });

  if (syncedIssues.length === 0) {
    return { updated: 0, errors: [] };
  }

  // Build a map of GitHub issue number → local issue for quick lookup
  const issuesByNumber = new Map<number, Issue>();
  for (const issue of syncedIssues) {
    issuesByNumber.set(issue.githubIssueNumber!, issue);
  }

  try {
    const githubIssues = await octokit.paginate(
      octokit.rest.issues.listForRepo,
      { owner, repo, state: "all", per_page: 100 },
    );

    for (const ghIssue of githubIssues) {
      // Skip pull requests (GitHub API includes them in issues endpoint)
      if (ghIssue.pull_request) continue;

      const localIssue = issuesByNumber.get(ghIssue.number);
      if (!localIssue) continue;

      const newGithubState: GithubState =
        ghIssue.state === "closed" ? "CLOSED" : "OPEN";
      const stateChanged = localIssue.githubState !== newGithubState;
      const shouldMarkDone =
        newGithubState === "CLOSED" && localIssue.status !== "DONE";

      if (!stateChanged && !shouldMarkDone) continue;

      try {
        await prisma.issue.update({
          where: { id: localIssue.id },
          data: {
            githubState: newGithubState,
            ...(shouldMarkDone ? { status: "DONE" } : {}),
          },
        });

        if (shouldMarkDone) {
          await logActivity(
            localIssue.id,
            "STATUS_CHANGED",
            "status",
            localIssue.status,
            "DONE",
          );
        }

        await logActivity(
          localIssue.id,
          "SYNCED",
          "githubState",
          localIssue.githubState,
          newGithubState,
        );

        updated++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(
          `Failed to update local issue #${ghIssue.number}: ${message}`,
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    errors.push(`Failed to fetch GitHub issues: ${message}`);
  }

  return { updated, errors };
}
