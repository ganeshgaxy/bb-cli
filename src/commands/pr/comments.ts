import { Command } from "commander";
import { getPullRequestComments } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, dim, cyan, gray, relativeTime } from "../../lib/format.js";

export const commentsCommand = new Command("comments")
  .alias("notes")
  .description("View pull request comments")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-p, --page <number>", "Page number", "1")
  .option("-P, --per-page <number>", "Items per page", "30")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    const result = await getPullRequestComments(
      workspace,
      repo,
      prId,
      {
        page: parseInt(opts.page, 10),
        pagelen: parseInt(opts.perPage, 10),
      },
      hostname,
    );

    if (opts.output === "json") {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const comments = result.values.filter((c) => !c.deleted);

    if (comments.length === 0) {
      console.log(`No comments on PR #${prId}`);
      return;
    }

    for (const comment of comments) {
      const author = bold(comment.user.display_name);
      const time = dim(relativeTime(comment.created_on));
      const commentId = gray(`#${comment.id}`);

      // Inline comment indicator
      const inline = comment.inline
        ? cyan(` [${comment.inline.path}:${comment.inline.to ?? comment.inline.from ?? "?"}]`)
        : "";

      // Reply indicator
      const reply = comment.parent ? dim(` ↳ reply to #${comment.parent.id}`) : "";

      console.log(`${author} ${commentId} ${time}${inline}${reply}`);
      console.log(`  ${comment.content.raw}`);
      console.log("");
    }

    if (result.next) {
      console.log(
        dim(`Page ${opts.page} — use -p ${parseInt(opts.page, 10) + 1} for next page`),
      );
    }
  });
