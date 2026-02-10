"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/utils/issue-activity";
import { autoSyncPushIssue } from "@/lib/github-sync";
import type { ActionResult, Issue } from "@/lib/types/actions";
import {
  createIssueSchema,
  type CreateIssueInput,
} from "@/lib/schemas/issue";

/**
 * Create a new issue - validates epicId belongs to same project
 */
export async function createIssue(
  input: CreateIssueInput
): Promise<ActionResult<Issue>> {
  try {
    const validated = createIssueSchema.safeParse(input);
    if (!validated.success) {
      return { error: validated.error.issues[0].message };
    }

    const { projectId, epicId, ...data } = validated.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // If epicId provided, verify it belongs to the same project
    if (epicId) {
      const epic = await prisma.epic.findUnique({
        where: { id: epicId },
        select: { projectId: true },
      });

      if (!epic) {
        return { error: "Epic not found" };
      }

      if (epic.projectId !== projectId) {
        return { error: "Epic does not belong to this project" };
      }
    }

    const issue = await prisma.issue.create({
      data: {
        ...data,
        projectId,
        epicId: epicId || null,
        description: data.description || null,
        labels: data.labels || [],
        assignees: data.assignees || [],
      },
    });

    await logActivity(issue.id, "CREATED");

    autoSyncPushIssue(issue.id);

    revalidatePath(`/projects/${issue.projectId}`);

    return { data: issue };
  } catch (error) {
    console.error("Failed to create issue:", error);
    return { error: "Failed to create issue" };
  }
}
