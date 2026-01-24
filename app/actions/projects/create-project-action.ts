"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, Project } from "@/lib/types/actions";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/schemas/project";

/**
 * Create a new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const validated = createProjectSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const { name, description, githubRepo } = validated.data;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        githubRepo: githubRepo || null,
      },
    });

    return { data: project };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project" };
  }
}
