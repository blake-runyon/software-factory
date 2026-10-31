#!/usr/bin/env bash
# Create a new project by cloning the factory starter repo.
# Usage: new-project.sh <name> [parent-dir]   (parent-dir defaults to the current directory)
# Env overrides:
#   FACTORY_STARTER_REPO  git URL or local path (default: public GitHub starter)
#   FACTORY_STARTER_REF   branch or tag to clone (default: main)
set -euo pipefail

STARTER_REPO="${FACTORY_STARTER_REPO:-https://github.com/blake-runyon/factory-starter.git}"
STARTER_REF="${FACTORY_STARTER_REF:-main}"

name="${1:?usage: new-project.sh <name> [parent-dir]}"
parent="${2:-$PWD}"
target="$parent/$name"

[[ "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "error: name must be lowercase letters, digits, dashes" >&2; exit 1; }
[[ -e "$target" ]] && { echo "error: $target already exists" >&2; exit 1; }

echo "Cloning $STARTER_REPO ($STARTER_REF)..."
git clone --quiet --depth 1 --branch "$STARTER_REF" "$STARTER_REPO" "$target"
starter_sha="$(git -C "$target" rev-parse --short HEAD)"
rm -rf "$target/.git"
cd "$target"

# Fill in the project name.
grep -rl --exclude-dir=node_modules '{{PROJECT_NAME}}' . | while read -r f; do
  NAME="$name" perl -pi -e 's/\{\{PROJECT_NAME\}\}/$ENV{NAME}/g' "$f"
done
npm pkg set name="$name"
npm install --package-lock-only --no-audit --no-fund --silent   # refresh lockfile name
chmod +x factory/bin/approve docker/init-test-db.sh

# Record which starter this project came from.
echo "$STARTER_REPO@$starter_sha" > factory/STARTER_VERSION

git init -q -b main
git add -A
git commit -q -m "chore: scaffold $name from factory-starter@$starter_sha"

cat <<EOF

Created $target (from factory-starter@$starter_sha)

Next:
  cd $target
  npm run setup      # install deps + Playwright browser
  npm run verify     # should be green before you start
  claude
  /factory:spec <describe your idea>
EOF
