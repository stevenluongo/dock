"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, IssueWithRelations } from "@/lib/types/actions";

/**
 * Get a single issue with epic and project info
 */
export async function getIssue(
  id: string
): Promise<ActionResult<IssueWithRelations>> {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        epic: {
          select: { id: true, title: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!issue) {
      return { error: "Issue not found" };
    }

    return { data: issue };
  } catch (error) {
    console.error("Failed to get issue:", error);
    return { error: "Failed to fetch issue" };
  }
}
