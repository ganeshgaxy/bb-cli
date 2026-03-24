import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type AuthType = "app_password" | "token";

export interface HostConfig {
  auth_type: AuthType;
  token: string;
  username?: string;
  user?: string;
  api_protocol?: string;
}

export interface Config {
  hosts: Record<string, HostConfig>;
}

const CONFIG_DIR = join(homedir(), ".config", "bb-cli");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { hosts: {} };
  }
  const raw = readFileSync(CONFIG_FILE, "utf-8");
  return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}

export function getHostConfig(hostname?: string): {
  hostname: string;
  config: HostConfig;
} | null {
  const cfg = loadConfig();
  const host = hostname ?? Object.keys(cfg.hosts)[0] ?? null;
  if (!host || !cfg.hosts[host]) return null;
  return { hostname: host, config: cfg.hosts[host] };
}

export function getAuthHeader(hostname?: string): string | null {
  // Environment variable takes precedence (like glab)
  const envToken = process.env.BB_TOKEN ?? process.env.BITBUCKET_TOKEN;
  if (envToken) return `Bearer ${envToken}`;

  const hostCfg = getHostConfig(hostname);
  if (!hostCfg) return null;

  const { config } = hostCfg;
  if (config.auth_type === "app_password" && config.username) {
    const encoded = Buffer.from(`${config.username}:${config.token}`).toString("base64");
    return `Basic ${encoded}`;
  }

  return `Bearer ${config.token}`;
}
