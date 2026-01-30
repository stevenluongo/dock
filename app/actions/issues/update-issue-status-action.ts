"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Issue } from "@/lib/types/actions";
import {
  updateIssueStatusSchema,
  type UpdateIssueStatusInput,
} from "@/lib/schemas/issue";

/**
 * Quick status update for drag-drop operations
 */
export async function updateIssueStatus(
  id: string,
  input: UpdateIssueStatusInput
): Promise<ActionResult<Issue>> {
  try {
    const validated = updateIssueStatusSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!issue) {
      return { error: "Issue not found" };
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status: validated.data.status,
        ...(validated.data.order !== undefined && { order: validated.data.order }),
      },
    });

    return { data: updatedIssue };
  } catch (error) {
    console.error("Failed to update issue status:", error);
    return { error: "Failed to update issue status" };
  }
}
