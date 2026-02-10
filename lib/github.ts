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
