#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
echo "==> Starting Hardhat node on http://127.0.0.1:8545 ..."
node_modules/.bin/hardhat node
