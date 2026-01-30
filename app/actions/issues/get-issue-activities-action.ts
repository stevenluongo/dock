"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, IssueActivity } from "@/lib/types/actions";

/**
 * Fetch activity log for a specific issue, ordered newest-first.
 */
export async function getIssueActivities(
  issueId: string
): Promise<ActionResult<IssueActivity[]>> {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true },
    });

    if (!issue) {
      return { error: "Issue not found" };
    }

    const activities = await prisma.issueActivity.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
    });

    return { data: activities };
  } catch (error) {
    console.error("Failed to fetch issue activities:", error);
    return { error: "Failed to fetch issue activities" };
  }
}
