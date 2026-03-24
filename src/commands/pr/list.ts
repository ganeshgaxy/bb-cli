import { Command } from "commander";
import { listPullRequests } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import {
  bold,
  dim,
  stateColor,
  relativeTime,
  truncate,
  cyan,
} from "../../lib/format.js";

export const listCommand = new Command("list")
  .alias("ls")
  .description("List pull requests")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option(
    "-s, --state <state>",
    "Filter by state: OPEN, MERGED, DECLINED, SUPERSEDED",
    "OPEN",
  )
  .option("-p, --page <number>", "Page number", "1")
  .option("-P, --per-page <number>", "Items per page", "30")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);

    const result = await listPullRequests(
      workspace,
      repo,
      {
        state: opts.state.toUpperCase(),
        page: parseInt(opts.page, 10),
        pagelen: parseInt(opts.perPage, 10),
      },
      hostname,
    );

    if (opts.output === "json") {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.values.length === 0) {
      console.log(
        `No ${opts.state.toLowerCase()} pull requests in ${workspace}/${repo}`,
      );
      return;
    }

    console.log(
      bold(
        `Showing ${result.values.length} of ${result.size ?? "?"} pull requests in ${workspace}/${repo}\n`,
      ),
    );

    for (const pr of result.values) {
      const id = cyan(`#${pr.id}`);
      const title = truncate(pr.title, 60);
      const state = stateColor(pr.state);
      const author = pr.author.display_name;
      const time = relativeTime(pr.created_on);
      const branch = `${pr.source.branch.name} → ${pr.destination.branch.name}`;

      console.log(`${id}  ${bold(title)}  ${state}`);
      console.log(`    ${dim(branch)}  ${dim(author)}  ${dim(time)}`);
    }

    if (result.next) {
      console.log(dim(`\nPage ${opts.page} — use -p ${parseInt(opts.page, 10) + 1} for next page`));
    }
  });
