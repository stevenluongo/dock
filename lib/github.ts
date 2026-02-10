export function getGitHubToken(): string {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("GITHUB_PAT environment variable is not configured");
  }
  return token;
}
