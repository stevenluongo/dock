"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/utils/issue-activity";
import { autoSyncPushIssue } from "@/lib/github-sync";
import type { ActionResult, Issue } from "@/lib/types/actions";

/**
 * Duplicate an issue — copies all fields except GitHub link.
 * Appends "(copy)" to the title.
 */
export async function duplicateIssue(
  id: string
): Promise<ActionResult<Issue>> {
  try {
    const source = await prisma.issue.findUnique({ where: { id } });

    if (!source) {
      return { error: "Issue not found" };
    }

    const count = await prisma.issue.count({
      where: { projectId: source.projectId, status: source.status },
    });

    const issue = await prisma.issue.create({
      data: {
        title: `${source.title} (copy)`,
        description: source.description,
        type: source.type,
        status: source.status,
        priority: source.priority,
        order: count,
        projectId: source.projectId,
        epicId: source.epicId,
        labels: source.labels,
        assignees: source.assignees,
      },
    });

    await logActivity(issue.id, "CREATED");

    autoSyncPushIssue(issue.id);

    revalidatePath(`/projects/${source.projectId}`);

    return { data: issue };
  } catch (error) {
    console.error("Failed to duplicate issue:", error);
    return { error: "Failed to duplicate issue" };
  }
}
