#!/bin/bash
# Sync sandbox-content CSS to git and server.
# Usage: ./scripts/sync-sandbox-css.sh
#
# What it does:
#   1. git add all *.module.css inside sandbox-content/
#   2. Commit + push to origin/main (skips if nothing changed)
#   3. SCP every CSS file to the server (overwrites)
#   4. Fix ownership for the Next.js container user (uid 1001)

set -e

SSH_KEY="$HOME/.ssh/id_ed25519_portfolio"
SSH_USER="root"
SSH_HOST="157.180.85.212"
SERVER_PATH="/var/www/cc-portfolio"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[sync-css] $1${NC}"; }
warn()  { echo -e "${YELLOW}[warn]     $1${NC}"; }
error() { echo -e "${RED}[error]    $1${NC}"; exit 1; }

# ── 0. Prerequisites ──────────────────────────────────────────────────────────
[ -f "$SSH_KEY" ] || error "SSH key not found: $SSH_KEY"
command -v scp  >/dev/null || error "scp not found"

cd "$(git rev-parse --show-toplevel)" || error "Not inside a git repo"

# ── 1. Collect all CSS files in sandbox-content ───────────────────────────────
mapfile -t CSS_FILES < <(find sandbox-content -name "*.css" | sort)

if [ ${#CSS_FILES[@]} -eq 0 ]; then
  warn "No CSS files found in sandbox-content/. Exiting."
  exit 0
fi

info "Found ${#CSS_FILES[@]} CSS file(s):"
for f in "${CSS_FILES[@]}"; do echo "    $f"; done
echo ""

# ── 2. Git: stage → commit → push ────────────────────────────────────────────
info "Staging CSS files..."
git add "${CSS_FILES[@]}"

if git diff --cached --quiet; then
  info "Nothing new to commit (files already up to date in git)."
else
  info "Committing..."
  git commit -m "chore: sync sandbox-content CSS"
  info "Pushing to origin/main..."
  git push origin main
  info "Git push done."
fi

# ── 3. SCP to server ──────────────────────────────────────────────────────────
info "Uploading to server..."
for f in "${CSS_FILES[@]}"; do
  dest_dir="$SERVER_PATH/$(dirname "$f")"
  ssh -i "$SSH_KEY" -o BatchMode=yes "$SSH_USER@$SSH_HOST" "mkdir -p '$dest_dir'"
  scp -q -i "$SSH_KEY" "$f" "$SSH_USER@$SSH_HOST:$SERVER_PATH/$f"
  echo "    ✓ $f"
done

# ── 4. Fix ownership ──────────────────────────────────────────────────────────
info "Fixing ownership on server (uid 1001)..."
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "chown -R 1001:1001 '$SERVER_PATH/sandbox-content'"

echo ""
info "Done. CSS files are live — no container restart needed."
