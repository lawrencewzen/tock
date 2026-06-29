#!/usr/bin/env bash
# Install the tock Claude Code skill to ~/.claude/skills/tock/.
# Override the skills root with CLAUDE_SKILLS_DIR; pass -f to overwrite
# an existing (possibly locally customized) installation.
set -euo pipefail

src="$(cd "$(dirname "$0")/.." && pwd)/skill/SKILL.md"
dest_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}/tock"
dest="$dest_dir/SKILL.md"

force=0
[[ "${1:-}" == "-f" || "${1:-}" == "--force" ]] && force=1

if [[ -e "$dest" && $force -eq 0 ]] && ! cmp -s "$src" "$dest"; then
  echo "error: $dest exists and differs from the bundled skill." >&2
  echo "       It may contain local customizations — rerun with -f to overwrite." >&2
  exit 1
fi

mkdir -p "$dest_dir"
cp "$src" "$dest"
echo "Installed tock skill to $dest"
