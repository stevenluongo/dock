"use server";

import { prisma } from "@/lib/db";
import { createGitHubClient } from "@/lib/github";
import {
  pushIssuesToGitHub,
  updateIssuesToGitHub,
  pullIssuesFromGitHub,
} from "@/lib/github-sync";
import type { ActionResult } from "@/lib/types/actions";

export type SyncSummary = {
  createdCount: number;
  updatedCount: number;
  importedCount: number;
  errors: string[];
  syncedAt: Date;
};

/**
 * Sync project issues with GitHub
 */
export async function syncProjectWithGithub(
  projectId: string
): Promise<ActionResult<SyncSummary>> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    if (!project.githubRepo) {
      return { error: "Project has no GitHub repository configured" };
    }

    let octokit;
    try {
      octokit = createGitHubClient();
    } catch {
      return { error: "GitHub PAT is not configured. Set GITHUB_PAT in your environment." };
    }

    // Push: Create GitHub issues for unsynced local issues
    const pushResult = await pushIssuesToGitHub(
      projectId,
      project.githubRepo,
      octokit,
    );

    // Push: Update already-synced issues that changed locally
    const updateResult = await updateIssuesToGitHub(
      projectId,
      project.githubRepo,
      octokit,
      project.githubSyncedAt,
    );

    // Pull: Fetch GitHub issue states and update local records
    const pullResult = await pullIssuesFromGitHub(
      projectId,
      project.githubRepo,
      octokit,
    );

    // Update sync timestamp
    const syncedAt = new Date();
    await prisma.project.update({
      where: { id: projectId },
      data: { githubSyncedAt: syncedAt },
    });

    return {
      data: {
        createdCount: pushResult.created,
        updatedCount: updateResult.updated + pullResult.updated,
        importedCount: pullResult.imported,
        errors: [
          ...pushResult.errors,
          ...updateResult.errors,
          ...pullResult.errors,
        ],
        syncedAt,
      },
    };
  } catch (error) {
    console.error("Failed to sync with GitHub:", error);
    return { error: "Failed to sync with GitHub" };
  }
}
