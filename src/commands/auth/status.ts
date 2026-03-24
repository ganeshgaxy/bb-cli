import { Command } from "commander";
import { loadConfig, getConfigPath } from "../../lib/config.js";
import { getCurrentUser } from "../../lib/api.js";
import { green, red, bold, dim } from "../../lib/format.js";

export const statusCommand = new Command("status")
  .description("View authentication status")
  .option("--hostname <host>", "Check a specific instance")
  .option("-a, --all", "Check all configured instances")
  .option("--show-token", "Display the authentication token")
  .action(async (opts) => {
    const config = loadConfig();
    const hosts = Object.keys(config.hosts);

    if (hosts.length === 0) {
      console.log("No authenticated hosts. Run `bb auth login` to set up.");
      process.exit(1);
    }

    const toCheck = opts.hostname
      ? [opts.hostname]
      : opts.all
        ? hosts
        : [hosts[0]];

    for (const hostname of toCheck) {
      const hostCfg = config.hosts[hostname];
      if (!hostCfg) {
        console.log(`${red("✗")} ${bold(hostname)}: not configured`);
        continue;
      }

      console.log(`${bold(hostname)}:`);

      const tokenDisplay = opts.showToken
        ? hostCfg.token
        : hostCfg.token.slice(0, 6) + "****";
      console.log(`  Token: ${tokenDisplay}`);

      if (hostCfg.user) {
        console.log(`  User: ${hostCfg.user}`);
      }

      // Verify token still works
      try {
        const user = await getCurrentUser(hostname);
        console.log(
          `  ${green("✓")} Token is valid ${dim(`(${user.display_name})`)}`,
        );
      } catch {
        console.log(`  ${red("✗")} Token is invalid or expired`);
      }
    }

    console.log(dim(`\n  Config: ${getConfigPath()}`));
  });
