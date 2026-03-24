import { Command } from "commander";
import { listCommand } from "./list.js";
import { viewCommand } from "./view.js";
import { createCommand } from "./create.js";
import { diffCommand } from "./diff.js";
import { commentsCommand } from "./comments.js";
import { commentCommand } from "./comment.js";
import { approveCommand, unapproveCommand } from "./approve.js";
import { mergeCommand } from "./merge.js";
import { declineCommand } from "./decline.js";
import { checkoutCommand } from "./checkout.js";
import { updateCommand } from "./update.js";

export const prCommand = new Command("pr")
  .description("Create, view, and manage pull requests")
  .addCommand(listCommand)
  .addCommand(viewCommand)
  .addCommand(createCommand)
  .addCommand(diffCommand)
  .addCommand(commentsCommand)
  .addCommand(commentCommand)
  .addCommand(approveCommand)
  .addCommand(unapproveCommand)
  .addCommand(mergeCommand)
  .addCommand(declineCommand)
  .addCommand(checkoutCommand)
  .addCommand(updateCommand);
