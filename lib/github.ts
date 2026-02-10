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
