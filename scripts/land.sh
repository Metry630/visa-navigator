#!/bin/sh
# Lands the current stream branch on main without rewriting history: merge main in, run every
# check, then fast-forward push. If the push is rejected because main moved, just run it again.
#
#   scripts/land.sh
set -eu
branch="$(git rev-parse --abbrev-ref HEAD)"
case "$branch" in
  stream/*) ;;
  *) echo "run this from a stream worktree (on stream/<id>), not from $branch" >&2; exit 1 ;;
esac

git fetch -q origin
git merge --no-edit origin/main
npm test --silent
npm run -s typecheck
npm run -s check:data
git push origin "HEAD:main"
echo "landed $branch on main"
