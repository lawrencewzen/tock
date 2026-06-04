import { Command } from "commander";
import { saveConfig } from "../core/config";
import { resolveProject } from "../core/resolve";
import { parseOutputFormat, printJson, printTable } from "../output";
import { loadContext } from "./context";

export function projectCommand(): Command {
  const cmd = new Command("project").description("Work with projects");

  cmd
    .command("list")
    .description("List projects (including the Inbox)")
    .option("-f, --filter <text>", "only projects whose name contains this text")
    .option("-o, --output <format>", "simple (default) or json", parseOutputFormat, "simple")
    .action(async (opts: { filter?: string; output: "simple" | "json" }) => {
      const { client } = await loadContext();
      let projects = await client.listProjects();

      if (opts.filter !== undefined) {
        const q = opts.filter.toLowerCase();
        projects = projects.filter((p) => p.name.toLowerCase().includes(q));
      }

      if (opts.output === "json") {
        printJson(projects);
        return;
      }
      if (projects.length === 0) {
        console.log("No projects found.");
        return;
      }
      printTable(
        ["ID", "NAME"],
        projects.map((p) => [p.id, p.name]),
      );
    });

  cmd
    .command("use <project>")
    .description("Set the default project (by exact id or name substring)")
    .action(async (query: string) => {
      const { client, config } = await loadContext();
      const projects = await client.listProjects();
      const selected = resolveProject(projects, query);
      await saveConfig({ ...config, defaultProjectId: selected.id });
      console.log(`Switched default project to ${selected.name} (${selected.id})`);
    });

  return cmd;
}
