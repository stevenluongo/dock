import { Octokit } from "@octokit/rest";

export function getGitHubToken(): string {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("GITHUB_PAT environment variable is not configured");
  }
  return token;
}

export function createGitHubClient(): Octokit {
  return new Octokit({ auth: getGitHubToken() });
}

export function parseGitHubRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split("/");
  return { owner, repo: name };
}

export class GitHubRateLimitError extends Error {
  resetAt: Date;
  constructor(resetAt: Date) {
    const waitMin = Math.ceil((resetAt.getTime() - Date.now()) / 60000);
    super(`GitHub API rate limit exceeded. Resets in ${waitMin} minute${waitMin !== 1 ? "s" : ""}.`);
    this.name = "GitHubRateLimitError";
    this.resetAt = resetAt;
  }
}

export async function checkRateLimit(
  octokit: Octokit,
): Promise<{ remaining: number; limit: number; resetAt: Date }> {
  const { data } = await octokit.rest.rateLimit.get();
  const core = data.resources.core;
  return {
    remaining: core.remaining,
    limit: core.limit,
    resetAt: new Date(core.reset * 1000),
  };
}

export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    if (status !== 403 && status !== 429) throw error;

    const headers = (error as { response?: { headers?: Record<string, string> } })
      .response?.headers;

    let waitMs: number;
    const retryAfter = headers?.["retry-after"];
    if (retryAfter) {
      waitMs = parseInt(retryAfter, 10) * 1000;
    } else {
      const resetEpoch = headers?.["x-ratelimit-reset"];
      if (resetEpoch) {
        waitMs = parseInt(resetEpoch, 10) * 1000 - Date.now();
      } else {
        waitMs = 60_000;
      }
    }

    if (waitMs > 0 && waitMs <= 60_000) {
      await new Promise((resolve) => setTimeout(resolve, waitMs + 1000));
      return fn();
    }

    throw new GitHubRateLimitError(new Date(Date.now() + Math.max(waitMs, 0)));
  }
}

export async function validateGitHubRepo(
  repo: string,
): Promise<{ valid: boolean; error?: string }> {
  let octokit;
  try {
    octokit = createGitHubClient();
  } catch {
    return { valid: false, error: "GitHub PAT is not configured" };
  }

  const { owner, repo: repoName } = parseGitHubRepo(repo);

  try {
    await octokit.rest.repos.get({ owner, repo: repoName });
    return { valid: true };
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    if (status === 404) {
      return { valid: false, error: "Repository not found" };
    }
    if (status === 401 || status === 403) {
      return { valid: false, error: "No access to this repository" };
    }
    return { valid: false, error: "Failed to validate repository" };
  }
}
