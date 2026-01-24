"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, ProjectWithIssueCounts } from "@/lib/types/actions";
import { IssueStatus } from "@/generated/prisma/client";

/**
 * Get all projects with issue counts per status
 * Sorted by most recently updated
 */
export async function getAllProjects(): Promise<
  ActionResult<ProjectWithIssueCounts[]>
> {
  try {
    const projects = await prisma.project.findMany({
      include: {
        issues: {
          select: { status: true },
        },
        _count: {
          select: { epics: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const projectsWithCounts = projects.map((project) => {
      const issueCounts = {
        backlog: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
      };

      project.issues.forEach((issue) => {
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

      const { issues: _, _count, ...projectData } = project;
      return { ...projectData, issueCounts, epicCount: _count.epics };
    });

    return { data: projectsWithCounts };
  } catch (error) {
    console.error("Failed to get projects:", error);
    return { error: "Failed to fetch projects" };
  }
}
