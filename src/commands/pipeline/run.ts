import { Command } from "commander";
import { execSync } from "node:child_process";
import { triggerPipeline } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { green, cyan, dim } from "../../lib/format.js";

function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();
}

export const pipelineRunCommand = new Command("run")
  .alias("trigger")
  .description("Trigger a new pipeline")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-b, --branch <branch>", "Branch to run pipeline on")
  .option("--pattern <pattern>", "Custom pipeline pattern (selector)")
  .option("-F, --output <format>", "Output format: text, json", "text")
  .action(async (opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);

    let branch = opts.branch;
    if (!branch) {
      try {
        branch = getCurrentBranch();
      } catch {
        console.error(
          "Error: could not detect current branch. Use --branch to specify.",
        );
        process.exit(1);
      }
    }

    const data: Parameters<typeof triggerPipeline>[2] = {
      target: {
        type: "pipeline_ref_target",
        ref_type: "branch",
        ref_name: branch,
      },
    };

    if (opts.pattern) {
      data.target.selector = { type: "custom", pattern: opts.pattern };
    }

    const pipeline = await triggerPipeline(workspace, repo, data, hostname);

    if (opts.output === "json") {
      console.log(JSON.stringify(pipeline, null, 2));
      return;
    }

    console.log(
      `${green("✓")} Triggered pipeline ${cyan(`#${pipeline.build_number}`)} on ${cyan(branch)}`,
    );
    console.log(dim(`  UUID: ${pipeline.uuid}`));
  });
