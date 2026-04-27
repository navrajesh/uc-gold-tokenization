#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "==> Installing frontend dependencies..."
  npm install
fi

echo "==> Starting frontend dev server on http://localhost:3000 ..."
npm run dev
