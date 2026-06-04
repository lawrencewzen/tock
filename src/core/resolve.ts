import type { Project } from "../api/schemas";

/**
 * Resolves a user-supplied query to exactly one project. An exact id match
 * wins; otherwise case-insensitive substring match on the name. Zero or
 * multiple matches throw (the latter listing candidates so the user can
 * disambiguate).
 */
export function resolveProject(projects: readonly Project[], query: string): Project {
  const byId = projects.find((p) => p.id === query);
  if (byId) return byId;

  const q = query.toLowerCase();
  const matched = projects.filter((p) => p.name.toLowerCase().includes(q));

  if (matched.length === 1) return matched[0]!;
  if (matched.length === 0) {
    throw new Error(`no project matches '${query}'`);
  }
  const candidates = matched.map((p) => `  ${p.name} (${p.id})`).join("\n");
  throw new Error(`'${query}' matches multiple projects, be more specific:\n${candidates}`);
}
