import { Command } from "commander";
import { stopPipeline, listPipelines } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { yellow, cyan } from "../../lib/format.js";

export const pipelineStopCommand = new Command("stop")
  .alias("cancel")
  .description("Stop a running pipeline")
  .argument("<build-number>", "Pipeline build number")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .action(async (buildNumber, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const num = parseInt(buildNumber, 10);

    // Look up UUID from build number
    const pipelines = await listPipelines(workspace, repo, { pagelen: 100 }, hostname);
    const pipeline = pipelines.values.find((p) => p.build_number === num);

    if (!pipeline) {
      console.error(`Pipeline #${buildNumber} not found`);
      process.exit(1);
    }

    await stopPipeline(workspace, repo, pipeline.uuid, hostname);
    console.log(`${yellow("✓")} Stopped pipeline ${cyan(`#${num}`)}`);
  });
