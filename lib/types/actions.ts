import type {
  Project,
  Epic,
  Issue,
  Priority,
  IssueType,
  IssueStatus,
  GithubState,
} from "@/generated/prisma/client";

// Core ActionResult type for consistent returns
export type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string };

// Re-export Prisma types for convenience
export type {
  Project,
  Epic,
  Issue,
  Priority,
  IssueType,
  IssueStatus,
  GithubState,
};

// Issue counts by status
export type IssueCounts = {
  backlog: number;
  todo: number;
  inProgress: number;
  done: number;
};

// Project with issue counts for dashboard
export type ProjectWithIssueCounts = {
  id: string;
  name: string;
  description: string | null;
  githubRepo: string | null;
  githubSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  issueCounts: IssueCounts;
  epicCount: number;
};

// Epic with issue counts for list view
export type EpicWithIssueCounts = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  issueCounts: IssueCounts;
};

// Project with epics (each epic has issue counts)
export type ProjectWithEpics = {
  id: string;
  name: string;
  description: string | null;
  githubRepo: string | null;
  githubSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  epics: EpicWithIssueCounts[];
};

// Epic with all its issues
export type EpicWithIssues = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  issues: Issue[];
};

// Issue with related epic and project info
export type IssueWithRelations = {
  id: string;
  projectId: string;
  epicId: string | null;
  title: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  labels: string[];
  assignees: string[];
  githubIssueNumber: number | null;
  githubState: GithubState;
  createdAt: Date;
  updatedAt: Date;
  epic: { id: string; title: string } | null;
  project: { id: string; name: string };
};

// Filter options for issues
export type IssueFilters = {
  status?: IssueStatus;
  epicId?: string | "none"; // "none" for unassigned issues
  priority?: Priority;
  type?: IssueType;
};
