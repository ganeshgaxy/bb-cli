import { Command } from "commander";
import { execSync } from "node:child_process";
import { createPullRequest } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, cyan, green, dim } from "../../lib/format.js";
import { ask } from "../../lib/prompt.js";

function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();
}

export const createCommand = new Command("create")
  .description("Create a new pull request")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("--title <title>", "PR title")
  .option("--description <desc>", "PR description")
  .option("-s, --source <branch>", "Source branch")
  .option("-d, --destination <branch>", "Destination branch")
  .option("--reviewer <uuids>", "Reviewer UUIDs (comma-separated)")
  .option("--close-source-branch", "Delete source branch after merge")
  .option("--draft", "Create as draft (adds DRAFT prefix)")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);

    let title: string = opts.title ?? "";
    let description: string = opts.description ?? "";
    let source: string = opts.source ?? "";
    const destination: string | undefined = opts.destination;

    // Auto-detect source branch
    if (!source) {
      try {
        source = getCurrentBranch();
      } catch {
        console.error(
          "Error: could not detect current branch. Use --source to specify.",
        );
        process.exit(1);
      }
    }

    // Interactive mode if title not provided
    if (!title) {
      title = await ask("PR title", source);
      description = await ask("Description (optional)");
    }

    if (opts.draft) {
      title = `DRAFT: ${title}`;
    }

    const data: Parameters<typeof createPullRequest>[2] = {
      title,
      source: { branch: { name: source } },
    };

    if (description) data.description = description;
    if (destination) data.destination = { branch: { name: destination } };
    if (opts.closeSourceBranch) data.close_source_branch = true;
    if (opts.reviewer) {
      data.reviewers = opts.reviewer
        .split(",")
        .map((uuid: string) => ({ uuid: uuid.trim() }));
    }

    const pr = await createPullRequest(workspace, repo, data, hostname);

    if (opts.output === "json") {
      console.log(JSON.stringify(pr, null, 2));
      return;
    }

    console.log(
      `${green("✓")} Created PR ${cyan(`#${pr.id}`)} ${bold(pr.title)}`,
    );
    console.log(
      dim(
        `  ${pr.source.branch.name} → ${pr.destination.branch.name}`,
      ),
    );
    const url = pr.links?.html?.href;
    if (url) console.log(dim(`  ${url}`));
  });
