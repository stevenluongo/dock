import type { Octokit } from "@octokit/rest";
import type { Issue, IssueType, Priority, GithubState } from "@/lib/types/actions";
import { prisma } from "@/lib/db";
import { parseGitHubRepo } from "@/lib/github";
import { logActivity } from "@/lib/utils/issue-activity";

type GitHubIssueData = Awaited<
  ReturnType<Octokit["rest"]["issues"]["listForRepo"]>
>["data"][number];

export async function fetchGitHubIssues(
  githubRepo: string,
  octokit: Octokit,
): Promise<GitHubIssueData[]> {
  const { owner, repo } = parseGitHubRepo(githubRepo);
  return octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "all",
    per_page: 100,
  });
}

const VALID_TYPES = new Set(["TASK", "STORY", "BUG", "DOCS"]);
const VALID_PRIORITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

function parseGitHubLabels(labelObjects: (string | { name?: string })[]): {
  type: IssueType;
  priority: Priority;
  labels: string[];
} {
  let type: IssueType = "TASK";
  let priority: Priority = "MEDIUM";
  const labels: string[] = [];

  for (const labelObj of labelObjects) {
    const label = typeof labelObj === "string" ? labelObj : (labelObj.name ?? "");
    if (label.startsWith("type:")) {
      const value = label.slice(5).toUpperCase();
      if (VALID_TYPES.has(value)) {
        type = value as IssueType;
      } else {
        labels.push(label);
      }
    } else if (label.startsWith("priority:")) {
      const value = label.slice(9).toUpperCase();
      if (VALID_PRIORITIES.has(value)) {
        priority = value as Priority;
      } else {
        labels.push(label);
      }
    } else if (label) {
      labels.push(label);
    }
  }

  return { type, priority, labels };
}

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

export async function updateIssuesToGitHub(
  projectId: string,
  githubRepo: string,
  octokit: Octokit,
  lastSyncedAt: Date | null,
  ghIssuesByNumber: Map<number, GitHubIssueData>,
): Promise<{ updated: number; conflicts: number; errors: string[] }> {
  const { owner, repo } = parseGitHubRepo(githubRepo);
  const errors: string[] = [];
  let updated = 0;
  let conflicts = 0;

  const where: Record<string, unknown> = {
    projectId,
    githubIssueNumber: { not: null },
  };

  // Only push issues changed since last sync
  if (lastSyncedAt) {
    where.updatedAt = { gt: lastSyncedAt };
  }

  const changedIssues = await prisma.issue.findMany({ where });

  for (const issue of changedIssues) {
    // Conflict detection: check if GitHub also changed since last sync
    const ghIssue = ghIssuesByNumber.get(issue.githubIssueNumber!);
    if (ghIssue && lastSyncedAt && ghIssue.updated_at) {
      const ghUpdatedAt = new Date(ghIssue.updated_at);
      if (ghUpdatedAt > lastSyncedAt) {
        // Both sides changed — last-write wins
        conflicts++;
        if (ghUpdatedAt > issue.updatedAt) {
          // GitHub is newer — skip push
          continue;
        }
        // Local is newer — proceed with push
      }
    }

    try {
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issue.githubIssueNumber!,
        title: issue.title,
        body: issue.description || "",
        labels: buildGitHubLabels(issue),
        state: issue.status === "DONE" ? "closed" : "open",
      });

      const newGithubState = issue.status === "DONE" ? "CLOSED" : "OPEN";
      if (issue.githubState !== newGithubState) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { githubState: newGithubState },
        });
      }

      await logActivity(issue.id, "SYNCED");

      updated++;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(
        `Failed to update GitHub issue #${issue.githubIssueNumber}: ${message}`,
      );
    }
  }

  return { updated, conflicts, errors };
}

export async function pullIssuesFromGitHub(
  projectId: string,
  githubIssues: GitHubIssueData[],
  lastSyncedAt: Date | null,
): Promise<{ updated: number; imported: number; conflicts: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;
  let imported = 0;
  let conflicts = 0;

  const syncedIssues = await prisma.issue.findMany({
    where: { projectId, githubIssueNumber: { not: null } },
  });

  // Build a map of GitHub issue number → local issue for quick lookup
  const issuesByNumber = new Map<number, Issue>();
  for (const issue of syncedIssues) {
    issuesByNumber.set(issue.githubIssueNumber!, issue);
  }

  for (const ghIssue of githubIssues) {
    // Skip pull requests (GitHub API includes them in issues endpoint)
    if (ghIssue.pull_request) continue;

    const localIssue = issuesByNumber.get(ghIssue.number);

    if (localIssue) {
      // Update existing synced issue
      const newGithubState: GithubState =
        ghIssue.state === "closed" ? "CLOSED" : "OPEN";
      const stateChanged = localIssue.githubState !== newGithubState;
      const shouldMarkDone =
        newGithubState === "CLOSED" && localIssue.status !== "DONE";

      if (!stateChanged && !shouldMarkDone) continue;

      // Conflict detection: if local also changed since last sync, compare timestamps
      if (lastSyncedAt && localIssue.updatedAt > lastSyncedAt && ghIssue.updated_at) {
        const ghUpdatedAt = new Date(ghIssue.updated_at);
        if (ghUpdatedAt <= lastSyncedAt) continue; // GitHub didn't change — no conflict
        conflicts++;
        if (localIssue.updatedAt > ghUpdatedAt) {
          // Local is newer — skip pull for this issue
          continue;
        }
        // GitHub is newer — proceed with pull
      }

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
    } else {
      // Import new GitHub issue
      try {
        const githubState: GithubState =
          ghIssue.state === "closed" ? "CLOSED" : "OPEN";
        const status = githubState === "CLOSED" ? "DONE" : "BACKLOG";
        const parsed = parseGitHubLabels(ghIssue.labels);
        const assignees = (ghIssue.assignees ?? [])
          .map((a) => a.login)
          .filter(Boolean);

        const issue = await prisma.issue.create({
          data: {
            projectId,
            title: ghIssue.title,
            description: ghIssue.body || null,
            type: parsed.type,
            priority: parsed.priority,
            labels: parsed.labels,
            assignees,
            status,
            githubIssueNumber: ghIssue.number,
            githubState,
          },
        });

        await logActivity(issue.id, "CREATED");

        imported++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(
          `Failed to import GitHub issue #${ghIssue.number}: ${message}`,
        );
      }
    }
  }

  return { updated, imported, conflicts, errors };
}
