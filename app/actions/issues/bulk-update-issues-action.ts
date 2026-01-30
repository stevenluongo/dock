"use server";

import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/utils/issue-activity";
import type { ActionResult } from "@/lib/types/actions";
import {
  bulkUpdateIssuesSchema,
  type BulkUpdateIssuesInput,
} from "@/lib/schemas/issue";

/**
 * Bulk update status and/or priority for multiple issues.
 */
export async function bulkUpdateIssues(
  input: BulkUpdateIssuesInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const validated = bulkUpdateIssuesSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const { ids, status, priority } = validated.data;

    if (!status && !priority) {
      return { error: "Nothing to update" };
    }

    // Fetch current values for activity logging
    const currentIssues = await prisma.issue.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, priority: true },
    });

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;

    const result = await prisma.issue.updateMany({
      where: { id: { in: ids } },
      data,
    });

    // Log activity for each changed issue
    const activityPromises: Promise<void>[] = [];
    for (const issue of currentIssues) {
      if (status && issue.status !== status) {
        activityPromises.push(
          logActivity(issue.id, "STATUS_CHANGED", "status", issue.status, status)
        );
      }
      if (priority && issue.priority !== priority) {
        activityPromises.push(
          logActivity(issue.id, "EDITED", "priority", issue.priority, priority)
        );
      }
    }
    await Promise.all(activityPromises);

    return { data: { count: result.count } };
  } catch (error) {
    console.error("Failed to bulk update issues:", error);
    return { error: "Failed to bulk update issues" };
  }
}
