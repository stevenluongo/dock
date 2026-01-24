"use server";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types/actions";

/**
 * Delete a project - cascades to epics and issues
 */
export async function deleteProject(
  id: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    await prisma.project.delete({
      where: { id },
    });

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { error: "Failed to delete project" };
  }
}
