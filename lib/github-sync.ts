import type { Octokit } from "@octokit/rest";
import type { Issue, IssueType, Priority, GithubState } from "@/lib/types/actions";
import { prisma } from "@/lib/db";
import { createGitHubClient, parseGitHubRepo, withRateLimit, GitHubRateLimitError } from "@/lib/github";
import { logActivity } from "@/lib/utils/issue-activity";

type GitHubIssueData = Awaited<
  ReturnType<Octokit["rest"]["issues"]["listForRepo"]>
>["data"][number];

export async function fetchGitHubIssues(
  githubRepo: string,
  octokit: Octokit,
): Promise<GitHubIssueData[]> {
  const { owner, repo } = parseGitHubRepo(githubRepo);
  return withRateLimit(() =>
    octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo,
      state: "all",
      per_page: 100,
    }),
  );
}

const VALID_TYPES = new Set(["TASK", "STORY", "BUG", "DOCS"]);
const VALID_PRIORITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const LABEL_COLORS: Record<string, string> = {
  "type:task": "1d76db",
  "type:story": "0e8a16",
  "type:bug": "d73a4a",
  "type:docs": "0075ca",
  "priority:critical": "b60205",
  "priority:high": "d93f0b",
  "priority:medium": "fbca04",
  "priority:low": "c5def5",
};
const DEFAULT_LABEL_COLOR = "ededed";
const EPIC_LABEL_COLOR = "7057ff";

function slugifyEpicTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseGitHubLabels(labelObjects: (string | { name?: string })[]): {
  type: IssueType;
  priority: Priority;
  labels: string[];
  epicSlug: string | null;
} {
  let type: IssueType = "TASK";
  let priority: Priority = "MEDIUM";
  let epicSlug: string | null = null;
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
    } else if (label.startsWith("epic:")) {
      epicSlug = label.slice(5);
    } else if (label) {
      labels.push(label);
    }
  }

  return { type, priority, labels, epicSlug };
}

function buildGitHubLabels(issue: Issue, epicTitle?: string | null): string[] {
  const labels: string[] = [];
  labels.push(`type:${issue.type.toLowerCase()}`);
  labels.push(`priority:${issue.priority.toLowerCase()}`);
  labels.push(...issue.labels);
  if (epicTitle) {
    labels.push(`epic:${slugifyEpicTitle(epicTitle)}`);
  }
  return labels;
}

export async function ensureLabelsExist(
  projectId: string,
  githubRepo: string,
  octokit: Octokit,
): Promise<{ created: number; errors: string[] }> {
  const { owner, repo } = parseGitHubRepo(githubRepo);
  const errors: string[] = [];
  let created = 0;

  const issues = await prisma.issue.findMany({
    where: { projectId },
    select: { type: true, priority: true, labels: true, epic: { select: { title: true } } },
  });

  const neededLabels = new Set<string>();
  for (const issue of issues) {
    neededLabels.add(`type:${issue.type.toLowerCase()}`);
    neededLabels.add(`priority:${issue.priority.toLowerCase()}`);
    for (const label of issue.labels) {
      neededLabels.add(label);
    }
    if (issue.epic) {
      neededLabels.add(`epic:${slugifyEpicTitle(issue.epic.title)}`);
    }
  }

  const existingLabels = await withRateLimit(() =>
    octokit.paginate(octokit.rest.issues.listLabelsForRepo, { owner, repo, per_page: 100 }),
  );
  const existingNames = new Set(
    existingLabels.map((l) => l.name.toLowerCase()),
  );

  for (const label of neededLabels) {
    if (existingNames.has(label.toLowerCase())) continue;

    const color = label.startsWith("epic:")
      ? EPIC_LABEL_COLOR
      : (LABEL_COLORS[label] ?? DEFAULT_LABEL_COLOR);

    try {
      await withRateLimit(() =>
        octokit.rest.issues.createLabel({
          owner,
          repo,
          name: label,
          color,
        }),
      );
      created++;
    } catch (error) {
      if (error instanceof GitHubRateLimitError) {
        errors.push(error.message);
        break;
      }
      if ((error as { status?: number }).status === 422) continue;
      const message =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Failed to create label "${label}": ${message}`);
    }
  }

  return { created, errors };
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
    include: { epic: { select: { title: true } } },
  });

  for (const issue of unsyncedIssues) {
    try {
      const response = await withRateLimit(() =>
        octokit.rest.issues.create({
          owner,
          repo,
          title: issue.title,
          body: issue.description || "",
          labels: buildGitHubLabels(issue, issue.epic?.title),
        }),
      );

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
      if (error instanceof GitHubRateLimitError) {
        errors.push(error.message);
        break;
      }
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

  // Fetch all synced issues to detect label drift (e.g. epic labels added)
  const allSyncedIssues = await prisma.issue.findMany({
    where: { projectId, githubIssueNumber: { not: null } },
    include: { epic: { select: { title: true } } },
  });

  for (const issue of allSyncedIssues) {
    const ghIssue = ghIssuesByNumber.get(issue.githubIssueNumber!);

    // Check if this issue was modified since last sync
    const modifiedLocally = !lastSyncedAt || issue.updatedAt > lastSyncedAt;

    // Check if labels on GitHub differ from what we'd send
    const expectedLabels = buildGitHubLabels(issue, issue.epic?.title).sort();
    const currentGhLabels = ghIssue
      ? ghIssue.labels
          .map((l) => (typeof l === "string" ? l : l.name ?? ""))
          .filter(Boolean)
          .sort()
      : null;
    const labelsDrifted = currentGhLabels !== null &&
      JSON.stringify(expectedLabels) !== JSON.stringify(currentGhLabels);

    // Skip if nothing changed locally and labels match
    if (!modifiedLocally && !labelsDrifted) continue;

    // Conflict detection: check if GitHub also changed since last sync
    if (modifiedLocally && ghIssue && lastSyncedAt && ghIssue.updated_at) {
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
      await withRateLimit(() =>
        octokit.rest.issues.update({
          owner,
          repo,
          issue_number: issue.githubIssueNumber!,
          title: issue.title,
          body: issue.description || "",
          labels: buildGitHubLabels(issue, issue.epic?.title),
          state: issue.status === "DONE" ? "closed" : "open",
        }),
      );

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
      if (error instanceof GitHubRateLimitError) {
        errors.push(error.message);
        break;
      }
      const message =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(
        `Failed to update GitHub issue #${issue.githubIssueNumber}: ${message}`,
      );
    }
  }

  return { updated, conflicts, errors };
}

async function resolveEpicId(
  projectId: string,
  epicSlug: string | null,
): Promise<string | null> {
  if (!epicSlug) return null;

  // Find an epic whose slugified title matches
  const epics = await prisma.epic.findMany({
    where: { projectId },
    select: { id: true, title: true },
  });

  for (const epic of epics) {
    if (slugifyEpicTitle(epic.title) === epicSlug) {
      return epic.id;
    }
  }

  // No match — create a new epic using the slug as title
  const newEpic = await prisma.epic.create({
    data: {
      projectId,
      title: epicSlug,
    },
  });

  return newEpic.id;
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
      // Detect state changes
      const newGithubState: GithubState =
        ghIssue.state === "closed" ? "CLOSED" : "OPEN";
      const stateChanged = localIssue.githubState !== newGithubState;
      const shouldMarkDone =
        newGithubState === "CLOSED" && localIssue.status !== "DONE";

      // Detect label changes
      const parsed = parseGitHubLabels(ghIssue.labels);
      const typeChanged = localIssue.type !== parsed.type;
      const priorityChanged = localIssue.priority !== parsed.priority;
      const labelsChanged =
        JSON.stringify([...localIssue.labels].sort()) !==
        JSON.stringify([...parsed.labels].sort());

      const hasChanges =
        stateChanged || shouldMarkDone || typeChanged || priorityChanged || labelsChanged;

      if (!hasChanges) continue;

      // Conflict detection: if local also changed since last sync, compare timestamps
      if (lastSyncedAt && localIssue.updatedAt > lastSyncedAt && ghIssue.updated_at) {
        const ghUpdatedAt = new Date(ghIssue.updated_at);
        if (ghUpdatedAt <= lastSyncedAt) continue;
        conflicts++;
        if (localIssue.updatedAt > ghUpdatedAt) {
          continue;
        }
      }

      try {
        // Resolve epic from labels
        const epicId = await resolveEpicId(projectId, parsed.epicSlug);

        await prisma.issue.update({
          where: { id: localIssue.id },
          data: {
            githubState: newGithubState,
            ...(shouldMarkDone ? { status: "DONE" } : {}),
            ...(typeChanged ? { type: parsed.type } : {}),
            ...(priorityChanged ? { priority: parsed.priority } : {}),
            ...(labelsChanged ? { labels: parsed.labels } : {}),
            ...(epicId !== undefined ? { epicId } : {}),
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

        if (typeChanged) {
          await logActivity(localIssue.id, "SYNCED", "type", localIssue.type, parsed.type);
        }

        if (priorityChanged) {
          await logActivity(localIssue.id, "SYNCED", "priority", localIssue.priority, parsed.priority);
        }

        if (labelsChanged) {
          await logActivity(
            localIssue.id,
            "SYNCED",
            "labels",
            localIssue.labels.join(", ") || null,
            parsed.labels.join(", ") || null,
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

        // Resolve epic from labels
        const epicId = await resolveEpicId(projectId, parsed.epicSlug);

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
            ...(epicId ? { epicId } : {}),
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

export async function autoSyncPushIssue(issueId: string): Promise<void> {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: { select: { githubAutoSync: true, githubRepo: true } },
        epic: { select: { title: true } },
      },
    });

    if (!issue?.project?.githubAutoSync || !issue.project.githubRepo) return;

    let octokit;
    try {
      octokit = createGitHubClient();
    } catch {
      return;
    }

    const { owner, repo } = parseGitHubRepo(issue.project.githubRepo);
    const labels = buildGitHubLabels(issue, issue.epic?.title);

    if (issue.githubIssueNumber) {
      await withRateLimit(() =>
        octokit.rest.issues.update({
          owner,
          repo,
          issue_number: issue.githubIssueNumber!,
          title: issue.title,
          body: issue.description || "",
          labels,
          state: issue.status === "DONE" ? "closed" : "open",
        }),
      );
    } else {
      const response = await withRateLimit(() =>
        octokit.rest.issues.create({
          owner,
          repo,
          title: issue.title,
          body: issue.description || "",
          labels,
        }),
      );

      await prisma.issue.update({
        where: { id: issueId },
        data: {
          githubIssueNumber: response.data.number,
          githubState: "OPEN",
        },
      });
    }
  } catch {
    // Fire-and-forget: silently ignore errors
  }
}
