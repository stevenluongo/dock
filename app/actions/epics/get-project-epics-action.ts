"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, EpicWithIssueCounts } from "@/lib/types/actions";
import { IssueStatus, Priority } from "@/generated/prisma/client";

// Priority order map for sorting (CRITICAL first)
const priorityOrder: Record<Priority, number> = {
  [Priority.CRITICAL]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

/**
 * Get all epics for a project with issue counts
 * Sorted by priority (CRITICAL first), then by created date
 */
export async function getProjectEpics(
  projectId: string
): Promise<ActionResult<EpicWithIssueCounts[]>> {
  try {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    const epics = await prisma.epic.findMany({
      where: { projectId },
      include: {
        issues: {
          select: { status: true },
        },
      },
    });

    // Sort by priority order (CRITICAL first), then by createdAt
    const sortedEpics = [...epics].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const epicsWithCounts = sortedEpics.map((epic) => {
      const issueCounts = {
        backlog: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
      };

      epic.issues.forEach((issue) => {
        switch (issue.status) {
          case IssueStatus.BACKLOG:
            issueCounts.backlog++;
            break;
          case IssueStatus.TODO:
            issueCounts.todo++;
            break;
          case IssueStatus.IN_PROGRESS:
            issueCounts.inProgress++;
            break;
          case IssueStatus.DONE:
            issueCounts.done++;
            break;
        }
      });

      const { issues: _, ...epicData } = epic;
      return { ...epicData, issueCounts };
    });

    return { data: epicsWithCounts };
  } catch (error) {
    console.error("Failed to get project epics:", error);
    return { error: "Failed to fetch epics" };
  }
}
