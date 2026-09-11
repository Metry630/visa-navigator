#!/bin/sh
# Creates a git worktree for one stream so parallel Claude Code sessions never share a working tree.
#
#   scripts/new-stream.sh r-sg      # -> ../visa-navigator-r-sg on branch stream/r-sg
#
# Stream ids: r-sg, r-jp, d, c, e. Stream u (Lovable) runs from the main folder and needs no worktree.
set -eu
id="${1:?usage: scripts/new-stream.sh <r-sg|r-jp|d|c|e>}"
root="$(git rev-parse --show-toplevel)"
dir="$(dirname "$root")/$(basename "$root")-$id"

git -C "$root" fetch -q origin
if git -C "$root" show-ref -q --verify "refs/heads/stream/$id"; then
  git -C "$root" worktree add "$dir" "stream/$id"
else
  git -C "$root" worktree add -b "stream/$id" "$dir" origin/main
fi

# Untracked helpers don't follow into worktrees, so copy them. (.git/info/exclude is shared.)
mkdir -p "$dir/.claude/skills"
[ -d "$root/.claude/skills/offload" ] && cp -R "$root/.claude/skills/offload" "$dir/.claude/skills/"
[ -f "$root/CLAUDE.local.md" ] && cp "$root/CLAUDE.local.md" "$dir/"
[ -d "$root/.sources" ] && cp -R "$root/.sources" "$dir/"

npm install --prefix "$dir" --no-audit --no-fund >/dev/null
echo "ready: cd $dir && claude"
