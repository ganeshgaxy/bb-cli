import { Command } from "commander";
import { approvePullRequest, unapprovePullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { green, cyan, yellow } from "../../lib/format.js";

export const approveCommand = new Command("approve")
  .description("Approve a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    await approvePullRequest(workspace, repo, prId, hostname);
    console.log(`${green("✓")} Approved PR ${cyan(`#${prId}`)}`);
  });

export const unapproveCommand = new Command("unapprove")
  .description("Remove approval from a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    await unapprovePullRequest(workspace, repo, prId, hostname);
    console.log(`${yellow("✓")} Removed approval from PR ${cyan(`#${prId}`)}`);
  });
