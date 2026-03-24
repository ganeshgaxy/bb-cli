import { Command } from "commander";
import { listPipelines, getPipelineSteps, getPipelineStepLog } from "../../lib/api.js";
import { resolveRepo } from "../../lib/repo.js";
import { bold, dim, cyan } from "../../lib/format.js";

export const pipelineLogsCommand = new Command("logs")
  .alias("trace")
  .description("View pipeline step logs")
  .argument("<build-number>", "Pipeline build number")
  .option("-R, --repo <owner/repo>", "Select repository (workspace/repo)")
  .option("-s, --step <name>", "Step name (shows all steps if omitted)")
  .action(async (buildNumber, opts) => {
    const { hostname, workspace, repo } = resolveRepo(opts.repo);
    const num = parseInt(buildNumber, 10);

    // Look up pipeline UUID
    const pipelines = await listPipelines(workspace, repo, { pagelen: 100 }, hostname);
    const pipeline = pipelines.values.find((p) => p.build_number === num);

    if (!pipeline) {
      console.error(`Pipeline #${buildNumber} not found`);
      process.exit(1);
    }

    const steps = await getPipelineSteps(workspace, repo, pipeline.uuid, hostname);

    if (steps.values.length === 0) {
      console.log("No steps found");
      return;
    }

    const targetSteps = opts.step
      ? steps.values.filter((s) => s.name === opts.step)
      : steps.values;

    if (targetSteps.length === 0) {
      console.error(`Step "${opts.step}" not found. Available steps:`);
      for (const s of steps.values) {
        console.error(`  - ${s.name}`);
      }
      process.exit(1);
    }

    for (const step of targetSteps) {
      if (targetSteps.length > 1) {
        console.log(bold(`\n── ${step.name} ──`));
      }

      try {
        const log = await getPipelineStepLog(
          workspace,
          repo,
          pipeline.uuid,
          step.uuid,
          hostname,
        );
        process.stdout.write(log);
      } catch {
        console.log(dim("  (no logs available)"));
      }
    }
  });
