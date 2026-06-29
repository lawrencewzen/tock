import { Command } from "commander";
import { deleteToken } from "../core/token";
import { runInitFlow } from "./init";

export function resetCommand(): Command {
  return new Command("reset")
    .description("Drop the stored token and re-run OAuth authentication")
    .option("--provider <name>", "API provider: ticktick (default) or dida")
    .action(async (opts: { provider?: string }) => {
      await deleteToken();
      console.error("Removed stored token, re-authenticating...");
      await runInitFlow(opts.provider);
    });
}
