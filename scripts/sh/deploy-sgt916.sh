#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
echo "==> Deploying SGT916 token to localhost..."
node_modules/.bin/hardhat run scripts/deploy/02-deploy-sgt916.ts --network localhost
echo "==> Done. SGT916 addresses merged into deployments/localhost.json"
