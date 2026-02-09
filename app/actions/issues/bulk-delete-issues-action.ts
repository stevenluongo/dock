"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types/actions";
import {
  bulkDeleteIssuesSchema,
  type BulkDeleteIssuesInput,
} from "@/lib/schemas/issue";

/**
 * Bulk delete multiple issues.
 */
export async function bulkDeleteIssues(
  input: BulkDeleteIssuesInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const validated = bulkDeleteIssuesSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    // Fetch projectId before deletion
    const firstIssue = await prisma.issue.findFirst({
      where: { id: { in: validated.data.ids } },
      select: { projectId: true },
    });

    const result = await prisma.issue.deleteMany({
      where: { id: { in: validated.data.ids } },
    });

    if (firstIssue) {
      revalidatePath(`/projects/${firstIssue.projectId}`);
    }

    return { data: { count: result.count } };
  } catch (error) {
    console.error("Failed to bulk delete issues:", error);
    return { error: "Failed to bulk delete issues" };
  }
}
