"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/utils/issue-activity";
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

    const currentIssue = await prisma.issue.findUnique({
      where: { id },
      select: { id: true, status: true, projectId: true },
    });

    if (!currentIssue) {
      return { error: "Issue not found" };
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status: validated.data.status,
        ...(validated.data.order !== undefined && { order: validated.data.order }),
      },
    });

    if (currentIssue.status !== validated.data.status) {
      await logActivity(id, "STATUS_CHANGED", "status", currentIssue.status, validated.data.status);
    }

    revalidatePath(`/projects/${currentIssue.projectId}`);

    return { data: updatedIssue };
  } catch (error) {
    console.error("Failed to update issue status:", error);
    return { error: "Failed to update issue status" };
  }
}
