import { Command } from "commander";
import { getPullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import {
  bold,
  dim,
  stateColor,
  relativeTime,
  cyan,
  green,
  red,
} from "../../lib/format.js";

export const viewCommand = new Command("view")
  .description("View pull request details")
  .argument("<id>", "Pull request ID")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .option("-w, --web", "Open in browser")
  .action(async (id, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const prId = parseInt(id, 10);

    const pr = await getPullRequest(workspace, repo, prId, hostname);

    if (opts.output === "json") {
      console.log(JSON.stringify(pr, null, 2));
      return;
    }

    if (opts.web) {
      const url = pr.links?.html?.href;
      if (url) {
        const { execSync } = await import("node:child_process");
        execSync(`open "${url}"`);
        console.log(`Opening ${url} in browser...`);
        return;
      }
    }

    // Header
    console.log(bold(`${pr.title} ${cyan(`#${pr.id}`)}`));
    console.log(
      `${stateColor(pr.state)} • ${pr.author.display_name} opened ${relativeTime(pr.created_on)}`,
    );
    console.log(
      dim(
        `${pr.source.branch.name} → ${pr.destination.branch.name}`,
      ),
    );

    // Description
    if (pr.description) {
      console.log(`\n${pr.description}`);
    }

    // Reviewers
    if (pr.participants.length > 0) {
      console.log(bold("\nReviewers:"));
      for (const p of pr.participants) {
        if (p.role === "REVIEWER") {
          const status = p.approved ? green("✓ approved") : dim("pending");
          console.log(`  ${p.user.display_name} ${status}`);
        }
      }
    }

    // Stats
    console.log(
      dim(
        `\n${pr.comment_count} comments • ${pr.task_count} tasks • close source branch: ${pr.close_source_branch ? "yes" : "no"}`,
      ),
    );

    // Link
    const url = pr.links?.html?.href;
    if (url) {
      console.log(dim(`\nView on web: ${url}`));
    }
  });
