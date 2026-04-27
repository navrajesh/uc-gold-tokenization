#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
echo "==> Deploying contracts to localhost..."
node_modules/.bin/hardhat run scripts/deploy/01-deploy-gold-token.ts --network localhost
echo "==> Done. Addresses written to deployments/localhost.json"
