import { execSync } from "node:child_process";

export interface RepoInfo {
  hostname: string;
  workspace: string;
  repo: string;
}

/**
 * Parse a repo string like "workspace/repo" into parts.
 */
export function parseRepoFlag(repoStr: string): {
  workspace: string;
  repo: string;
} {
  const parts = repoStr.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid repo format "${repoStr}". Expected "workspace/repo".`,
    );
  }
  return { workspace: parts[0], repo: parts[1] };
}

/**
 * Detect Bitbucket repo from git remotes in the current directory.
 * Supports both SSH and HTTPS remote URLs.
 */
export function detectRepoFromRemotes(): RepoInfo | null {
  let remoteOutput: string;
  try {
    remoteOutput = execSync("git remote -v", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }

  const lines = remoteOutput.trim().split("\n");

  for (const line of lines) {
    const match = parseBitbucketRemote(line);
    if (match) return match;
  }

  return null;
}

function parseBitbucketRemote(line: string): RepoInfo | null {
  // SSH: git@bitbucket.org:workspace/repo.git (fetch)
  const sshMatch = line.match(
    /git@([^:]+):([^/]+)\/([^/\s]+?)(?:\.git)?\s/,
  );
  if (sshMatch) {
    const [, hostname, workspace, repo] = sshMatch;
    if (hostname!.includes("bitbucket")) {
      return { hostname: hostname!, workspace: workspace!, repo: repo! };
    }
  }

  // HTTPS: https://bitbucket.org/workspace/repo.git (fetch)
  const httpsMatch = line.match(
    /https?:\/\/([^/]+)\/([^/]+)\/([^/\s]+?)(?:\.git)?\s/,
  );
  if (httpsMatch) {
    const [, hostname, workspace, repo] = httpsMatch;
    if (hostname!.includes("bitbucket")) {
      return { hostname: hostname!, workspace: workspace!, repo: repo! };
    }
  }

  return null;
}

/**
 * Resolve repo info from --repo flag or git remote detection.
 */
export function resolveRepo(repoFlag?: string): RepoInfo {
  if (repoFlag) {
    const { workspace, repo } = parseRepoFlag(repoFlag);
    return { hostname: "bitbucket.org", workspace, repo };
  }

  const detected = detectRepoFromRemotes();
  if (detected) return detected;

  throw new Error(
    "Could not determine repository. Use -R workspace/repo or run from a git directory with a Bitbucket remote.",
  );
}
