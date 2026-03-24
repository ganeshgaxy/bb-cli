import { Command } from "commander";
import { mergePullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, cyan, green, magenta, dim } from "../../lib/format.js";

export const mergeCommand = new Command("merge")
  .description("Merge a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option(
    "--strategy <strategy>",
    "Merge strategy: merge_commit, squash, fast_forward",
  )
  .option("--close-source-branch", "Delete source branch after merge")
  .option("-m, --message <message>", "Merge commit message")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    const mergeOpts: {
      merge_strategy?: string;
      close_source_branch?: boolean;
      message?: string;
    } = {};

    if (opts.strategy) mergeOpts.merge_strategy = opts.strategy;
    if (opts.closeSourceBranch) mergeOpts.close_source_branch = true;
    if (opts.message) mergeOpts.message = opts.message;

    const pr = await mergePullRequest(workspace, repo, prId, mergeOpts, hostname);

    if (opts.output === "json") {
      console.log(JSON.stringify(pr, null, 2));
      return;
    }

    console.log(
      `${green("✓")} ${magenta("Merged")} PR ${cyan(`#${pr.id}`)} ${bold(pr.title)}`,
    );
    if (pr.merge_commit?.hash) {
      console.log(dim(`  Merge commit: ${pr.merge_commit.hash}`));
    }
  });
