import { Command } from "commander";
import {
  loadConfig,
  saveConfig,
  getConfigPath,
  type AuthType,
} from "../../lib/config.js";
import { verifyAuth } from "../../lib/api.js";
import { ask, askSecret, choose } from "../../lib/prompt.js";
import { green, bold, dim } from "../../lib/format.js";

export const loginCommand = new Command("login")
  .description("Authenticate with a Bitbucket instance")
  .option("--hostname <host>", "Bitbucket hostname", "bitbucket.org")
  .option("-t, --token <token>", "Access token (Bearer)")
  .option("-u, --username <user>", "Username (for app password auth)")
  .option("--stdin", "Read token from standard input")
  .action(async (opts) => {
    let hostname: string = opts.hostname;
    let token: string = opts.token ?? "";
    let username: string = opts.username ?? "";
    let authType: AuthType = "token";

    if (opts.stdin) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      token = Buffer.concat(chunks).toString("utf-8").trim();
    }

    if (!token) {
      // Interactive mode
      hostname = await ask("Bitbucket hostname", hostname);

      const method = await choose("Authentication method", [
        "App Password (Personal settings > App passwords)",
        "Atlassian API Token (manage.atlassian.com > API tokens)",
        "OAuth / Workspace Access Token (Bearer)",
      ]);

      if (method.startsWith("App Password") || method.startsWith("Atlassian API")) {
        authType = "app_password";
        username = await ask("Username (Atlassian email)");
        token = await askSecret(
          method.startsWith("App Password") ? "App password" : "API token",
        );
      } else {
        authType = "token";
        token = await askSecret("Paste your access token");
      }
    } else if (username) {
      authType = "app_password";
    }

    if (!token) {
      console.error("Error: no token provided.");
      process.exit(1);
    }

    // Auto-detect Atlassian API tokens (ATATT prefix) — they need Basic Auth
    if (token.startsWith("ATATT") && authType === "token") {
      authType = "app_password";
      if (!username) {
        console.log(
          dim("Detected Atlassian API token — Basic Auth required."),
        );
        username = await ask("Username (Atlassian email)");
      }
    }

    if (authType === "app_password" && !username) {
      console.error("Error: username required for app password auth. Use -u <username>.");
      process.exit(1);
    }

    // Save credentials so verifyAuth can use them
    const config = loadConfig();
    config.hosts[hostname] = {
      auth_type: authType,
      token,
      ...(username && { username }),
    };
    saveConfig(config);

    // Verify credentials work
    const result = await verifyAuth(hostname);

    if (!result.ok) {
      delete config.hosts[hostname];
      saveConfig(config);
      console.error("Error: authentication failed. Credentials may be invalid.");
      console.error(result.error);
      process.exit(1);
    }

    if (result.user) {
      config.hosts[hostname].user = result.user.display_name;
      saveConfig(config);
      console.log(
        `${green("✓")} Logged in as ${bold(result.user.display_name)} to ${bold(hostname)}`,
      );
    } else {
      console.log(
        `${green("✓")} Authenticated to ${bold(hostname)} ${dim("(token verified)")}`,
      );
    }

    console.log(`  Credentials stored in ${getConfigPath()}`);
  });
