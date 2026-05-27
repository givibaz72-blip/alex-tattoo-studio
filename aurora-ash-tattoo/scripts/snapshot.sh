#!/usr/bin/env bash
# Quick snapshot of the current working tree to a git commit.
# Use after every successful step (e.g. when Roo Code reports done and build is green).
# Usage: ./scripts/snapshot.sh "step 6: inquiry validation"
set -euo pipefail

cd "$(dirname "$0")/.."

MSG="${1:-checkpoint $(date +%Y-%m-%d_%H:%M)}"

# Remove stale lock file if any (sometimes editors leave them).
if [ -f .git/index.lock ]; then
  echo "Removing stale .git/index.lock"
  rm -f .git/index.lock
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit."
  exit 0
fi
git commit -m "$MSG"
echo "Snapshot saved: $MSG"
echo ""
echo "Recent history:"
git log --oneline -5
