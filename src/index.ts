#!/usr/bin/env node

import { Command } from "commander";
import { authCommand } from "./commands/auth/index.js";
import { prCommand } from "./commands/pr/index.js";
import { pipelineCommand } from "./commands/pipeline/index.js";
import { apiCommand } from "./commands/api.js";

const program = new Command();

program
  .name("bb")
  .description("A lightweight Bitbucket CLI")
  .version("0.1.0")
  .addCommand(authCommand)
  .addCommand(prCommand)
  .addCommand(pipelineCommand)
  .addCommand(apiCommand);

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
