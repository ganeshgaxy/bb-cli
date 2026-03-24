import { getAuthHeader } from "./config.js";

const DEFAULT_HOST = "bitbucket.org";
const API_BASE = "https://api.bitbucket.org/2.0";

export interface PaginatedResponse<T> {
  size?: number;
  page?: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: T[];
}

export interface BitbucketUser {
  display_name: string;
  uuid: string;
  nickname: string;
  type: string;
  account_id?: string;
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: string;
  created_on: string;
  updated_on: string;
  author: BitbucketUser;
  source: {
    branch: { name: string };
    repository?: { full_name: string };
  };
  destination: {
    branch: { name: string };
    repository?: { full_name: string };
  };
  reviewers: BitbucketUser[];
  participants: Array<{
    user: BitbucketUser;
    role: string;
    approved: boolean;
    state: string | null;
  }>;
  comment_count: number;
  task_count: number;
  merge_commit?: { hash: string } | null;
  close_source_branch: boolean;
  links: Record<string, { href: string }>;
}

export interface PRComment {
  id: number;
  content: { raw: string; markup: string; html: string };
  created_on: string;
  updated_on: string;
  user: BitbucketUser;
  inline?: {
    from: number | null;
    to: number | null;
    path: string;
  };
  parent?: { id: number };
  deleted: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`API error ${status} ${statusText}: ${body}`);
    this.name = "ApiError";
  }
}

function getApiBase(hostname?: string): string {
  if (!hostname || hostname === DEFAULT_HOST) {
    return API_BASE;
  }
  // Self-hosted Bitbucket Server/Data Center uses a different API path
  return `https://${hostname}/rest/api/latest`;
}

export interface RequestOptions {
  method?: string;
  raw?: boolean;
  body?: unknown;
}

async function request(
  path: string,
  hostname?: string,
  options?: RequestOptions,
): Promise<unknown> {
  const authHeader = getAuthHeader(hostname);
  if (!authHeader) {
    throw new Error(
      "Not authenticated. Run `bb auth login` to set up credentials.",
    );
  }

  const base = getApiBase(hostname);
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const method = options?.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: authHeader,
    Accept: options?.raw ? "text/plain" : "application/json",
  };

  const fetchOpts: RequestInit = { method, headers };

  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    fetchOpts.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOpts);

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, res.statusText, body);
  }

  if (res.status === 204) return {};

  if (options?.raw) {
    return res.text();
  }
  return res.json();
}

// Expose for bb api command
export { request as rawRequest, getApiBase };

export async function listPullRequests(
  workspace: string,
  repo: string,
  options?: { state?: string; page?: number; pagelen?: number },
  hostname?: string,
): Promise<PaginatedResponse<PullRequest>> {
  const state = options?.state ?? "OPEN";
  const page = options?.page ?? 1;
  const pagelen = options?.pagelen ?? 30;
  const path = `/repositories/${workspace}/${repo}/pullrequests?state=${state}&page=${page}&pagelen=${pagelen}`;
  return request(path, hostname) as Promise<PaginatedResponse<PullRequest>>;
}

export async function getPullRequest(
  workspace: string,
  repo: string,
  prId: number,
  hostname?: string,
): Promise<PullRequest> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}`;
  return request(path, hostname) as Promise<PullRequest>;
}

export async function getPullRequestDiff(
  workspace: string,
  repo: string,
  prId: number,
  hostname?: string,
): Promise<string> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/diff`;
  return request(path, hostname, { raw: true }) as Promise<string>;
}

export async function getPullRequestComments(
  workspace: string,
  repo: string,
  prId: number,
  options?: { page?: number; pagelen?: number },
  hostname?: string,
): Promise<PaginatedResponse<PRComment>> {
  const page = options?.page ?? 1;
  const pagelen = options?.pagelen ?? 30;
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/comments?page=${page}&pagelen=${pagelen}`;
  return request(path, hostname) as Promise<PaginatedResponse<PRComment>>;
}

export async function getCurrentUser(
  hostname?: string,
): Promise<BitbucketUser> {
  return request("/user", hostname) as Promise<BitbucketUser>;
}

// ── PR mutations ──

export async function createPullRequest(
  workspace: string,
  repo: string,
  data: {
    title: string;
    description?: string;
    source: { branch: { name: string } };
    destination?: { branch: { name: string } };
    reviewers?: Array<{ uuid: string }>;
    close_source_branch?: boolean;
  },
  hostname?: string,
): Promise<PullRequest> {
  const path = `/repositories/${workspace}/${repo}/pullrequests`;
  return request(path, hostname, {
    method: "POST",
    body: data,
  }) as Promise<PullRequest>;
}

export async function updatePullRequest(
  workspace: string,
  repo: string,
  prId: number,
  data: {
    title?: string;
    description?: string;
    destination?: { branch: { name: string } };
    reviewers?: Array<{ uuid: string }>;
    close_source_branch?: boolean;
  },
  hostname?: string,
): Promise<PullRequest> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}`;
  return request(path, hostname, { method: "PUT", body: data }) as Promise<PullRequest>;
}

export async function approvePullRequest(
  workspace: string,
  repo: string,
  prId: number,
  hostname?: string,
): Promise<void> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/approve`;
  await request(path, hostname, { method: "POST" });
}

export async function unapprovePullRequest(
  workspace: string,
  repo: string,
  prId: number,
  hostname?: string,
): Promise<void> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/approve`;
  await request(path, hostname, { method: "DELETE" });
}

export async function mergePullRequest(
  workspace: string,
  repo: string,
  prId: number,
  options?: {
    merge_strategy?: string;
    close_source_branch?: boolean;
    message?: string;
  },
  hostname?: string,
): Promise<PullRequest> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/merge`;
  return request(path, hostname, {
    method: "POST",
    body: options ?? {},
  }) as Promise<PullRequest>;
}

export async function declinePullRequest(
  workspace: string,
  repo: string,
  prId: number,
  hostname?: string,
): Promise<PullRequest> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/decline`;
  return request(path, hostname, { method: "POST" }) as Promise<PullRequest>;
}

export async function addPullRequestComment(
  workspace: string,
  repo: string,
  prId: number,
  content: string,
  hostname?: string,
): Promise<PRComment> {
  const path = `/repositories/${workspace}/${repo}/pullrequests/${prId}/comments`;
  return request(path, hostname, {
    method: "POST",
    body: { content: { raw: content } },
  }) as Promise<PRComment>;
}

// ── Pipelines ──

export interface Pipeline {
  uuid: string;
  build_number: number;
  state: {
    name: string;
    stage?: { name: string };
    result?: { name: string };
  };
  target: {
    type: string;
    ref_type?: string;
    ref_name?: string;
    selector?: { type: string; pattern: string };
  };
  creator?: BitbucketUser;
  created_on: string;
  completed_on?: string;
  duration_in_seconds?: number;
  links: Record<string, { href: string }>;
}

export interface PipelineStep {
  uuid: string;
  name: string;
  state: {
    name: string;
    result?: { name: string };
  };
  started_on?: string;
  completed_on?: string;
  duration_in_seconds?: number;
  script_commands?: Array<{ command: string }>;
}

export async function listPipelines(
  workspace: string,
  repo: string,
  options?: { page?: number; pagelen?: number },
  hostname?: string,
): Promise<PaginatedResponse<Pipeline>> {
  const page = options?.page ?? 1;
  const pagelen = options?.pagelen ?? 20;
  const path = `/repositories/${workspace}/${repo}/pipelines/?page=${page}&pagelen=${pagelen}&sort=-created_on`;
  return request(path, hostname) as Promise<PaginatedResponse<Pipeline>>;
}

export async function getPipeline(
  workspace: string,
  repo: string,
  pipelineUuid: string,
  hostname?: string,
): Promise<Pipeline> {
  const path = `/repositories/${workspace}/${repo}/pipelines/${pipelineUuid}`;
  return request(path, hostname) as Promise<Pipeline>;
}

export async function getPipelineSteps(
  workspace: string,
  repo: string,
  pipelineUuid: string,
  hostname?: string,
): Promise<PaginatedResponse<PipelineStep>> {
  const path = `/repositories/${workspace}/${repo}/pipelines/${pipelineUuid}/steps/`;
  return request(path, hostname) as Promise<PaginatedResponse<PipelineStep>>;
}

export async function getPipelineStepLog(
  workspace: string,
  repo: string,
  pipelineUuid: string,
  stepUuid: string,
  hostname?: string,
): Promise<string> {
  const path = `/repositories/${workspace}/${repo}/pipelines/${pipelineUuid}/steps/${stepUuid}/log`;
  return request(path, hostname, { raw: true }) as Promise<string>;
}

export async function triggerPipeline(
  workspace: string,
  repo: string,
  data: {
    target: {
      type: string;
      ref_type: string;
      ref_name: string;
      selector?: { type: string; pattern: string };
    };
  },
  hostname?: string,
): Promise<Pipeline> {
  const path = `/repositories/${workspace}/${repo}/pipelines/`;
  return request(path, hostname, { method: "POST", body: data }) as Promise<Pipeline>;
}

export async function stopPipeline(
  workspace: string,
  repo: string,
  pipelineUuid: string,
  hostname?: string,
): Promise<void> {
  const path = `/repositories/${workspace}/${repo}/pipelines/${pipelineUuid}/stopPipeline`;
  await request(path, hostname, { method: "POST" });
}

/**
 * Verify auth works by listing workspaces. Works with all token types
 * (app passwords, workspace tokens, repo tokens, OAuth).
 */
export async function verifyAuth(
  hostname?: string,
): Promise<{ ok: true; user?: BitbucketUser } | { ok: false; error: string }> {
  // First try /user (works with app passwords and OAuth tokens)
  try {
    const user = await getCurrentUser(hostname);
    return { ok: true, user };
  } catch {
    // /user failed — token might be a repo/workspace access token
  }

  // Fallback: try /workspaces (works with workspace access tokens)
  try {
    await request("/workspaces?pagelen=1", hostname);
    return { ok: true };
  } catch {
    // Still failed
  }

  // Last resort: try /repositories with pagelen=1 (works with repo access tokens)
  try {
    await request("/repositories?role=member&pagelen=1", hostname);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
