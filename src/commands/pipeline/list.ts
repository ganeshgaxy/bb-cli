import { Command } from "commander";
import { listPipelines } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, dim, cyan, green, red, yellow, relativeTime } from "../../lib/format.js";

function pipelineStateColor(state: { name: string; result?: { name: string } }): string {
  if (state.result) {
    switch (state.result.name) {
      case "SUCCESSFUL":
        return green("SUCCESSFUL");
      case "FAILED":
        return red("FAILED");
      case "STOPPED":
        return yellow("STOPPED");
      case "ERROR":
        return red("ERROR");
      default:
        return state.result.name;
    }
  }
  switch (state.name) {
    case "PENDING":
      return yellow("PENDING");
    case "IN_PROGRESS":
      return cyan("RUNNING");
    case "COMPLETED":
      return dim("COMPLETED");
    default:
      return state.name;
  }
}

export const pipelineListCommand = new Command("list")
  .alias("ls")
  .description("List pipelines")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-p, --page <number>", "Page number", "1")
  .option("-P, --per-page <number>", "Items per page", "20")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);

    const result = await listPipelines(
      workspace,
      repo,
      { page: parseInt(opts.page, 10), pagelen: parseInt(opts.perPage, 10) },
      hostname,
    );

    if (opts.output === "json") {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.values.length === 0) {
      console.log(`No pipelines in ${workspace}/${repo}`);
      return;
    }

    console.log(bold(`Pipelines in ${workspace}/${repo}\n`));

    for (const p of result.values) {
      const num = cyan(`#${p.build_number}`);
      const state = pipelineStateColor(p.state);
      const ref = p.target.ref_name ?? p.target.selector?.pattern ?? "?";
      const time = relativeTime(p.created_on);
      const duration = p.duration_in_seconds
        ? `${Math.floor(p.duration_in_seconds / 60)}m${p.duration_in_seconds % 60}s`
        : "";

      console.log(`${num}  ${state}  ${bold(ref)}  ${dim(time)}  ${dim(duration)}`);
    }
  });
