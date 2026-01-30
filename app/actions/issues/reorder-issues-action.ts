"use server";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types/actions";
import {
  reorderIssuesSchema,
  type ReorderIssuesInput,
} from "@/lib/schemas/issue";

/**
 * Batch-update issue order values within a column
 */
export async function reorderIssues(
  input: ReorderIssuesInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const validated = reorderIssuesSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    await prisma.$transaction(
      validated.data.updates.map(({ id, order }) =>
        prisma.issue.update({
          where: { id },
          data: { order },
        })
      )
    );

    return { data: { count: validated.data.updates.length } };
  } catch (error) {
    console.error("Failed to reorder issues:", error);
    return { error: "Failed to reorder issues" };
  }
}
