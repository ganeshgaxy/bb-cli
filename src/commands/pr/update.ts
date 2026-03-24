import { Command } from "commander";
import { updatePullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, cyan, green } from "../../lib/format.js";

export const updateCommand = new Command("update")
  .description("Update a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("--title <title>", "New title")
  .option("--description <desc>", "New description")
  .option("-d, --destination <branch>", "New destination branch")
  .option("--close-source-branch", "Delete source branch after merge")
  .option("--no-close-source-branch", "Keep source branch after merge")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    const data: Parameters<typeof updatePullRequest>[3] = {};

    if (opts.title) data.title = opts.title;
    if (opts.description) data.description = opts.description;
    if (opts.destination) data.destination = { branch: { name: opts.destination } };
    if (opts.closeSourceBranch !== undefined) {
      data.close_source_branch = opts.closeSourceBranch;
    }

    if (Object.keys(data).length === 0) {
      console.error("Error: nothing to update. Provide --title, --description, or --destination.");
      process.exit(1);
    }

    const pr = await updatePullRequest(workspace, repo, prId, data, hostname);

    if (opts.output === "json") {
      console.log(JSON.stringify(pr, null, 2));
      return;
    }

    console.log(
      `${green("✓")} Updated PR ${cyan(`#${pr.id}`)} ${bold(pr.title)}`,
    );
  });
