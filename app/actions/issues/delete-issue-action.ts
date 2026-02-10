"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types/actions";

/**
 * Delete an issue - just unlinks from GitHub, doesn't delete GitHub issue
 */
export async function deleteIssue(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      return { error: "Issue not found" };
    }

    const projectId = issue.projectId;

    await prisma.issue.delete({
      where: { id },
    });

    revalidatePath(`/projects/${projectId}`);

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete issue:", error);
    return { error: "Failed to delete issue" };
  }
}
