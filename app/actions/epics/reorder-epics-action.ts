"use server";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types/actions";
import {
  reorderEpicsSchema,
  type ReorderEpicsInput,
} from "@/lib/schemas/epic";

/**
 * Batch-update epic order values
 */
export async function reorderEpics(
  input: ReorderEpicsInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const validated = reorderEpicsSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    await prisma.$transaction(
      validated.data.updates.map(({ id, order }) =>
        prisma.epic.update({
          where: { id },
          data: { order },
        })
      )
    );

    return { data: { count: validated.data.updates.length } };
  } catch (error) {
    console.error("Failed to reorder epics:", error);
    return { error: "Failed to reorder epics" };
  }
}
