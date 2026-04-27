#!/usr/bin/env bash
# Starts the full stack: Hardhat node, backend API, and frontend dev server.
# Each layer opens in its own terminal window.
#
# Usage:
#   ./scripts/sh/start-all.sh          # chain + backend + frontend
#   ./scripts/sh/start-all.sh --deploy # also deploy contracts after chain starts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY=false
[[ "$1" == "--deploy" ]] && DEPLOY=true

to_win_path() {
  if command -v cygpath &>/dev/null; then
    cygpath -w "$1"
  else
    echo "$1" | sed -E 's|^/([a-zA-Z])/|\1:\\|; s|/|\\|g'
  fi
}

open_window() {
  local title="$1"
  local script="$2"
  local win_script
  win_script="$(to_win_path "$script")"
  cmd.exe /c start "$title" cmd.exe /k "\"$win_script\""
}

echo "==> Launching Gold Tokenization Platform..."

open_window "HH Node"     "$SCRIPT_DIR/start-chain.sh"
sleep 1
open_window "Backend API" "$SCRIPT_DIR/start-backend.sh"
open_window "Frontend"    "$SCRIPT_DIR/start-frontend.sh"

if $DEPLOY; then
  echo "==> Waiting 5 s for Hardhat node to initialise..."
  sleep 5
  open_window "Deploy" "$SCRIPT_DIR/deploy.sh"
fi

echo ""
echo "  Chain    →  http://127.0.0.1:8545"
echo "  Backend  →  http://localhost:3001"
echo "  Frontend →  http://localhost:3000"
echo ""
echo "  Tip: run with --deploy to deploy contracts automatically."
