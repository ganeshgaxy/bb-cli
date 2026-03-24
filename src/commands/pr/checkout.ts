import { Command } from "commander";
import { execSync } from "node:child_process";
import { getPullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { green, cyan, dim } from "../../lib/format.js";

export const checkoutCommand = new Command("checkout")
  .alias("co")
  .description("Check out a pull request branch locally")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    const pr = await getPullRequest(workspace, repo, prId, hostname);
    const branch = pr.source.branch.name;

    // Fetch and checkout the branch
    try {
      execSync(`git fetch origin ${branch}`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      execSync(`git checkout ${branch}`, {
        encoding: "utf-8",
        stdio: "inherit",
      });
      console.log(
        `${green("✓")} Checked out PR ${cyan(`#${prId}`)} → branch ${cyan(branch)}`,
      );
      console.log(dim(`  ${pr.title}`));
    } catch (err) {
      console.error(`Error checking out branch "${branch}":`);
      console.error((err as Error).message);
      process.exit(1);
    }
  });
