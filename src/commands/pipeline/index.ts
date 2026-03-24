import { Command } from "commander";
import { pipelineListCommand } from "./list.js";
import { pipelineViewCommand } from "./view.js";
import { pipelineRunCommand } from "./run.js";
import { pipelineStopCommand } from "./stop.js";
import { pipelineLogsCommand } from "./logs.js";

export const pipelineCommand = new Command("pipeline")
  .alias("ci")
  .description("Manage pipelines (CI/CD)")
  .addCommand(pipelineListCommand)
  .addCommand(pipelineViewCommand)
  .addCommand(pipelineRunCommand)
  .addCommand(pipelineStopCommand)
  .addCommand(pipelineLogsCommand);
