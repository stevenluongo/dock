"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Issue } from "@/lib/types/actions";
import {
  updateIssueSchema,
  type UpdateIssueInput,
} from "@/lib/schemas/issue";

/**
 * Update an issue - validates epicId belongs to same project if changing
 */
export async function updateIssue(
  id: string,
  input: UpdateIssueInput
): Promise<ActionResult<Issue>> {
  try {
    const validated = updateIssueSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    // Get current issue to know its project
    const currentIssue = await prisma.issue.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!currentIssue) {
      return { error: "Issue not found" };
    }

    // If epicId is being changed, validate it belongs to the same project
    if (validated.data.epicId !== undefined && validated.data.epicId !== null) {
      const epic = await prisma.epic.findUnique({
        where: { id: validated.data.epicId },
        select: { projectId: true },
      });

      if (!epic) {
        return { error: "Epic not found" };
      }

      if (epic.projectId !== currentIssue.projectId) {
        return { error: "Epic does not belong to this project" };
      }
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: validated.data,
    });

    return { data: issue };
  } catch (error) {
    console.error("Failed to update issue:", error);
    return { error: "Failed to update issue" };
  }
}
