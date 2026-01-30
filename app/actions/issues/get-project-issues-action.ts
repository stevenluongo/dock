"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Issue, IssueFilters } from "@/lib/types/actions";
import { issueFiltersSchema } from "@/lib/schemas/issue";

/**
 * Get all issues for a project with optional filters
 * Sorted by priority, then created date
 */
export async function getProjectIssues(
  projectId: string,
  filters?: IssueFilters
): Promise<ActionResult<Issue[]>> {
  try {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // Validate filters if provided
    if (filters) {
      const validated = issueFiltersSchema.safeParse(filters);
      if (!validated.success) {
        return { error: validated.error.issues[0].message };
      }
    }

    // Build where clause
    const where: Record<string, unknown> = { projectId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.epicId) {
      if (filters.epicId === "none") {
        where.epicId = null;
      } else {
        where.epicId = filters.epicId;
      }
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return { data: issues };
  } catch (error) {
    console.error("Failed to get project issues:", error);
    return { error: "Failed to fetch issues" };
  }
}
