"use server";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types/actions";

/**
 * Delete an epic - issues get epicId set to null (handled by Prisma onDelete: SetNull)
 */
export async function deleteEpic(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const epic = await prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      return { error: "Epic not found" };
    }

    await prisma.epic.delete({
      where: { id },
    });

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete epic:", error);
    return { error: "Failed to delete epic" };
  }
}
