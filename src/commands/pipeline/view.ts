import { Command } from "commander";
import { getPipeline, getPipelineSteps } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, dim, cyan, green, red, yellow, relativeTime } from "../../lib/format.js";

function stepStateIcon(state: { name: string; result?: { name: string } }): string {
  if (state.result) {
    switch (state.result.name) {
      case "SUCCESSFUL":
        return green("✓");
      case "FAILED":
        return red("✗");
      case "STOPPED":
        return yellow("■");
      default:
        return "?";
    }
  }
  switch (state.name) {
    case "PENDING":
      return yellow("○");
    case "IN_PROGRESS":
      return cyan("●");
    default:
      return "?";
  }
}

export const pipelineViewCommand = new Command("view")
  .description("View pipeline details and steps")
  .argument("<build-number>", "Pipeline build number")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (buildNumber, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);

    // Bitbucket API uses UUIDs internally, but we can look up by build number
    // by listing pipelines and matching. For now, fetch via build_number using
    // the paginated endpoint with a filter.
    const { listPipelines } = await import("../../lib/api.js");
    const pipelines = await listPipelines(workspace, repo, { pagelen: 100 }, hostname);
    const num = parseInt(buildNumber, 10);
    const pipeline = pipelines.values.find((p) => p.build_number === num);

    if (!pipeline) {
      console.error(`Pipeline #${buildNumber} not found`);
      process.exit(1);
    }

    const steps = await getPipelineSteps(
      workspace,
      repo,
      pipeline.uuid,
      hostname,
    );

    if (opts.output === "json") {
      console.log(JSON.stringify({ pipeline, steps: steps.values }, null, 2));
      return;
    }

    // Header
    const ref = pipeline.target.ref_name ?? "?";
    console.log(bold(`Pipeline #${pipeline.build_number}`) + `  ${ref}`);
    console.log(dim(`Created ${relativeTime(pipeline.created_on)}`));
    if (pipeline.duration_in_seconds) {
      const m = Math.floor(pipeline.duration_in_seconds / 60);
      const s = pipeline.duration_in_seconds % 60;
      console.log(dim(`Duration: ${m}m${s}s`));
    }
    console.log("");

    // Steps
    if (steps.values.length === 0) {
      console.log(dim("No steps"));
      return;
    }

    console.log(bold("Steps:"));
    for (const step of steps.values) {
      const icon = stepStateIcon(step.state);
      const duration = step.duration_in_seconds
        ? dim(` (${Math.floor(step.duration_in_seconds / 60)}m${step.duration_in_seconds % 60}s)`)
        : "";
      console.log(`  ${icon} ${step.name}${duration}`);
    }
  });
