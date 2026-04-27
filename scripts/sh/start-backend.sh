#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/backend"

if [ ! -f .env ]; then
  echo "==> .env not found — copying from .env.example"
  cp .env.example .env
fi

if [ ! -d node_modules ]; then
  echo "==> Installing backend dependencies..."
  npm install
fi

echo "==> Checking for process already on port 3001..."
if command -v fuser &>/dev/null; then
  fuser -k 3001/tcp 2>/dev/null || true
elif command -v lsof &>/dev/null; then
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

echo "==> Starting backend API on http://localhost:3001 ..."
npm run dev
