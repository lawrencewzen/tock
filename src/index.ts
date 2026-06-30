#!/usr/bin/env bun
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { projectCommand } from "./commands/project";
import { resetCommand } from "./commands/reset";
import { taskCommand } from "./commands/task";

const program = new Command()
  .name("tock")
  .description(
    "A machine-friendly CLI for TickTick / Dida365 — built for AI-skill todo workflows",
  )
  .version("0.1.1")
  .option("-P, --project-id <id>", "operate on this project instead of the default");

program.addCommand(initCommand());
program.addCommand(resetCommand());
program.addCommand(projectCommand());
program.addCommand(taskCommand());

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`error: ${message}`);
  process.exit(1);
});
