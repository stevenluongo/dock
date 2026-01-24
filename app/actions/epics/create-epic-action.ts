"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Epic } from "@/lib/types/actions";
import {
  createEpicSchema,
  type CreateEpicInput,
} from "@/lib/schemas/epic";
import { Priority } from "@/generated/prisma/client";

/**
 * Create a new epic
 */
export async function createEpic(
  input: CreateEpicInput
): Promise<ActionResult<Epic>> {
  try {
    const validated = createEpicSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const { title, projectId, description, priority } = validated.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    const epic = await prisma.epic.create({
      data: {
        title,
        projectId,
        description: description || null,
        priority: priority || Priority.MEDIUM,
      },
    });

    return { data: epic };
  } catch (error) {
    console.error("Failed to create epic:", error);
    return { error: "Failed to create epic" };
  }
}
