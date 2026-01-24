"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Project } from "@/lib/types/actions";
import {
  updateProjectSchema,
  type UpdateProjectInput,
} from "@/lib/schemas/project";

/**
 * Update a project - clears githubSyncedAt if githubRepo changes
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const validated = updateProjectSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    // Get current project to check if githubRepo is changing
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: { githubRepo: true },
    });

    if (!currentProject) {
      return { error: "Project not found" };
    }

    const updateData: Record<string, unknown> = { ...validated.data };

    // Clear githubSyncedAt if githubRepo is changing
    if (
      validated.data.githubRepo !== undefined &&
      validated.data.githubRepo !== currentProject.githubRepo
    ) {
      updateData.githubSyncedAt = null;
    }

    // Handle empty string as null for githubRepo
    if (updateData.githubRepo === "") {
      updateData.githubRepo = null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return { data: project };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { error: "Failed to update project" };
  }
}
