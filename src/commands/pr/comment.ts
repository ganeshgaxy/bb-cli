import { Command } from "commander";
import { addPullRequestComment } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { green, cyan, dim } from "../../lib/format.js";
import { ask } from "../../lib/prompt.js";

export const commentCommand = new Command("comment")
  .alias("note")
  .description("Add a comment to a pull request")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-m, --message <message>", "Comment message")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    let message: string = opts.message ?? "";

    if (!message) {
      message = await ask("Comment");
    }

    if (!message) {
      console.error("Error: no comment message provided.");
      process.exit(1);
    }

    const comment = await addPullRequestComment(
      workspace,
      repo,
      prId,
      message,
      hostname,
    );

    if (opts.output === "json") {
      console.log(JSON.stringify(comment, null, 2));
      return;
    }

    console.log(
      `${green("✓")} Added comment to PR ${cyan(`#${prId}`)}`,
    );
    console.log(dim(`  ${message}`));
  });
