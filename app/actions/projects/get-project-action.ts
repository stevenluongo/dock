"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, ProjectWithEpics } from "@/lib/types/actions";
import { IssueStatus } from "@/generated/prisma/client";

/**
 * Get a single project with epics and their issue counts
 */
export async function getProject(
  id: string
): Promise<ActionResult<ProjectWithEpics>> {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        epics: {
          include: {
            issues: {
              select: { status: true },
            },
          },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    const epicsWithCounts = project.epics.map((epic) => {
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

    const { epics: _, ...projectData } = project;
    return { data: { ...projectData, epics: epicsWithCounts } };
  } catch (error) {
    console.error("Failed to get project:", error);
    return { error: "Failed to fetch project" };
  }
}
