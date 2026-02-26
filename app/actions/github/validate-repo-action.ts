"use server";

import { validateGitHubRepo } from "@/lib/github";
import type { ActionResult } from "@/lib/types/actions";

const githubRepoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

export async function validateGitHubRepoAction(
  repo: string,
): Promise<ActionResult<{ valid: boolean }>> {
  if (!githubRepoRegex.test(repo)) {
    return { error: "Invalid GitHub repo format. Use owner/repo" };
  }

  const result = await validateGitHubRepo(repo);

  if (!result.valid) {
    return { error: result.error! };
  }

  return { data: { valid: true } };
}
