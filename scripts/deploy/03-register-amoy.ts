import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

type Deployment = {
  network: string;
  chainId: number;
  tokens: {
    SGT999: {
      proxy: string;
      deploymentTxHash?: string | null;
      identityRegistry: string;
      compliance: string;
      goldReserve: string;
      barRegistrationTxHash?: string | null;
    };
  };
  accounts: {
    deployer: string;
    custodian: string;
    investor1: string;
    investor2: string;
  };
};

async function post(api: string, route: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(`${api}${route}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.ok) return "registered";
  if (response.status === 409) return "already registered";
  throw new Error(`${route}: ${response.status} ${await response.text()}`);
}

async function main() {
  const api = (process.env.DEMO_API_URL ?? "").replace(/\/$/, "");
  const seedToken = process.env.DEMO_SEED_TOKEN ?? "";
  if (!api || !seedToken) {
    throw new Error("DEMO_API_URL and DEMO_SEED_TOKEN are required");
  }

  const deploymentFile = path.join(__dirname, "../../deployments/amoy.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("deployments/amoy.json not found; do not redeploy to recreate it");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8")) as Deployment;
  if (deployment.network !== "amoy" || deployment.chainId !== 80002) {
    throw new Error("Deployment file is not for Polygon Amoy (chain ID 80002)");
  }

  const token = deployment.tokens.SGT999;
  if (!token) throw new Error("SGT999 deployment is missing from deployments/amoy.json");

  const headers = {
    "Content-Type": "application/json",
    "x-demo-seed-token": seedToken,
  };
  const unknownTxHash = `0x${"0".repeat(64)}`;

  console.log("Registering existing Amoy deployment with the hosted backend...");

  console.log("Token:", await post(api, "/api/tokens", headers, {
    address: token.proxy,
    name: "Singapore Fine Gold",
    symbol: "SGT999",
    decimals: "18",
    deployer: deployment.accounts.deployer,
    txHash: token.deploymentTxHash ?? unknownTxHash,
    complianceAddress: token.compliance,
    identityRegistryAddress: token.identityRegistry,
    goldReserveAddress: token.goldReserve,
    purityStandard: "999.9",
    custodianAddress: deployment.accounts.custodian,
  }));

  console.log("Gold bar:", await post(api, "/api/reserves/import", headers, {
    tokenAddress: token.proxy,
    barId: "GB-2024-001",
    weightGrams: 1000,
    purityBps: 9999,
    vaultId: "Vault-SG-A",
    custodian: deployment.accounts.custodian,
    assayRef: "ASSAY-SG-001",
    txHash: token.barRegistrationTxHash ?? null,
  }));

  for (const [label, address] of Object.entries({
    deployer: deployment.accounts.deployer,
    investor1: deployment.accounts.investor1,
    investor2: deployment.accounts.investor2,
  })) {
    const result = await post(api, "/api/identities/import", headers, {
      address,
      tokenAddress: token.proxy,
      countryCode: "SG",
      verified: true,
    });
    console.log(`Identity ${label}:`, result);
  }

  console.log("Hosted registration complete. No contracts were redeployed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
