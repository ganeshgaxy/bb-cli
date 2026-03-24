import { Command } from "commander";
import { declinePullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { cyan, red } from "../../lib/format.js";

export const declineCommand = new Command("decline")
  .description("Decline (close) a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    await declinePullRequest(workspace, repo, prId, hostname);
    console.log(`${red("✓")} Declined PR ${cyan(`#${prId}`)}`);
  });
