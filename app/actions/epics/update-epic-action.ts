"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Epic } from "@/lib/types/actions";
import {
  updateEpicSchema,
  type UpdateEpicInput,
} from "@/lib/schemas/epic";

/**
 * Update an epic
 */
export async function updateEpic(
  id: string,
  input: UpdateEpicInput
): Promise<ActionResult<Epic>> {
  try {
    const validated = updateEpicSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const epic = await prisma.epic.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!epic) {
      return { error: "Epic not found" };
    }

    const updatedEpic = await prisma.epic.update({
      where: { id },
      data: validated.data,
    });

    return { data: updatedEpic };
  } catch (error) {
    console.error("Failed to update epic:", error);
    return { error: "Failed to update epic" };
  }
}
