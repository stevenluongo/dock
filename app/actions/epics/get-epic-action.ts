"use server";

import { prisma } from "@/lib/db";
import type { ActionResult, EpicWithIssues } from "@/lib/types/actions";

/**
 * Get a single epic with all its issues
 */
export async function getEpic(id: string): Promise<ActionResult<EpicWithIssues>> {
  try {
    const epic = await prisma.epic.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!epic) {
      return { error: "Epic not found" };
    }

    return { data: epic };
  } catch (error) {
    console.error("Failed to get epic:", error);
    return { error: "Failed to fetch epic" };
  }
}
