import { Command } from "commander";
import { getPullRequestDiff } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";

export const diffCommand = new Command("diff")
  .description("View changes in a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("--color <mode>", "Color output: always, never, auto", "auto")
  .option("--raw", "Raw diff output (pipeable)")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    const diff = await getPullRequestDiff(workspace, repo, prId, hostname);

    if (opts.raw || opts.color === "never") {
      process.stdout.write(diff);
      return;
    }

    // Colorize diff output
    const lines = diff.split("\n");
    for (const line of lines) {
      if (line.startsWith("+++") || line.startsWith("---")) {
        console.log(`\x1b[1m${line}\x1b[0m`);
      } else if (line.startsWith("+")) {
        console.log(`\x1b[32m${line}\x1b[0m`);
      } else if (line.startsWith("-")) {
        console.log(`\x1b[31m${line}\x1b[0m`);
      } else if (line.startsWith("@@")) {
        console.log(`\x1b[36m${line}\x1b[0m`);
      } else if (line.startsWith("diff ")) {
        console.log(`\x1b[1;33m${line}\x1b[0m`);
      } else {
        console.log(line);
      }
    }
  });
