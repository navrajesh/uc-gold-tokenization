import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const signers = await ethers.getSigners();
  const deployer  = signers[0];
  const custodian = signers[1];
  const investor1 = signers[2];
  const investor2 = signers[3];

  console.log("=== SGT916 Gold Token Deployment ===");
  console.log("Deployer  :", deployer.address);
  console.log("Custodian :", custodian.address);
  console.log("");

  // ── 1. IdentityRegistry ────────────────────────────────────────────────────
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(deployer.address);
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry :", await identityRegistry.getAddress());

  // ── 2. ModularCompliance ───────────────────────────────────────────────────
  const ModularCompliance = await ethers.getContractFactory("ModularCompliance");
  const compliance = await ModularCompliance.deploy(deployer.address);
  await compliance.waitForDeployment();
  console.log("ModularCompliance:", await compliance.getAddress());

  // ── 3. Compliance modules ──────────────────────────────────────────────────
  const ONE_GRAM   = ethers.parseUnits("1",     18);
  const MAX_WALLET = ethers.parseUnits("10000", 18);

  const CountryRestrictions = await ethers.getContractFactory("CountryRestrictions");
  const countryModule = await CountryRestrictions.deploy(deployer.address);
  await countryModule.waitForDeployment();

  const MaxWalletBalance = await ethers.getContractFactory("MaxWalletBalance");
  const maxWalletModule = await MaxWalletBalance.deploy(deployer.address, MAX_WALLET);
  await maxWalletModule.waitForDeployment();

  const MinTransferAmount = await ethers.getContractFactory("MinTransferAmount");
  const minTransferModule = await MinTransferAmount.deploy(deployer.address, ONE_GRAM);
  await minTransferModule.waitForDeployment();

  await (await compliance.addModule(await countryModule.getAddress())).wait();
  await (await compliance.addModule(await maxWalletModule.getAddress())).wait();
  await (await compliance.addModule(await minTransferModule.getAddress())).wait();
  console.log("Compliance modules wired");

  // ── 4. GoldReserve ────────────────────────────────────────────────────────
  const GoldReserve = await ethers.getContractFactory("GoldReserve");
  const goldReserve = await GoldReserve.deploy(deployer.address, custodian.address);
  await goldReserve.waitForDeployment();
  console.log("GoldReserve      :", await goldReserve.getAddress());

  // ── 5. GoldToken (UUPS proxy) ─────────────────────────────────────────────
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const impl = await GoldToken.deploy();
  await impl.waitForDeployment();

  const initData = GoldToken.interface.encodeFunctionData("initialize", [
    await identityRegistry.getAddress(),
    await compliance.getAddress(),
    "Singapore Gold 916",   // name
    "SGT916",               // symbol
    18,                     // decimals
    ethers.ZeroAddress,     // onchainID — not used in POC
    deployer.address,       // admin
    "916",                  // purityStandard
    await goldReserve.getAddress(),
    custodian.address,
  ]);

  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(await impl.getAddress(), initData);
  await proxy.waitForDeployment();

  const token = GoldToken.attach(await proxy.getAddress());
  console.log("GoldToken impl   :", await impl.getAddress());
  console.log("GoldToken proxy  :", await proxy.getAddress());

  // ── 6. KYC register demo investors ───────────────────────────────────────
  await (await identityRegistry.registerIdentity(investor1.address, true)).wait();
  await (await identityRegistry.registerIdentity(investor2.address, true)).wait();
  await (await identityRegistry.registerIdentity(deployer.address,  true)).wait();
  console.log("KYC registered: deployer, investor1, investor2");

  // ── 7. Register a demo gold bar ───────────────────────────────────────────
  const reserveAsCustodian = goldReserve.connect(custodian);
  await (await reserveAsCustodian.registerBar(
    "GB916-2024-001",
    500,            // 500 grams
    9160,           // 916 purity (bps)
    "Vault-SG-B",
    "ASSAY-SG-916"
  )).wait();
  console.log("Bar registered: GB916-2024-001 (500g, 916 purity)");

  // ── 8. Mint initial tokens ────────────────────────────────────────────────
  const MINT_AMOUNT = ethers.parseUnits("200", 18); // 200 SGT916 — leaves 300g headroom
  await (await (token as any).mint(deployer.address, MINT_AMOUNT)).wait();
  console.log("Minted 200 SGT916 to issuer:", deployer.address);

  // ── 9. Save / merge deployment addresses ─────────────────────────────────
  const proxyAddress    = await proxy.getAddress();
  const reserveAddress  = await goldReserve.getAddress();
  const registryAddress = await identityRegistry.getAddress();
  const complianceAddr  = await compliance.getAddress();

  const deploymentFile = path.join(__dirname, "../../deployments/localhost.json");
  let existing: Record<string, any> = {};
  if (fs.existsSync(deploymentFile)) {
    existing = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  }

  existing.tokens = existing.tokens ?? {};
  existing.tokens["SGT916"] = {
    proxy:            proxyAddress,
    implementation:   await impl.getAddress(),
    identityRegistry: registryAddress,
    compliance:       complianceAddr,
    goldReserve:      reserveAddress,
    complianceModules: {
      countryRestrictions: await countryModule.getAddress(),
      maxWalletBalance:    await maxWalletModule.getAddress(),
      minTransferAmount:   await minTransferModule.getAddress(),
    },
  };

  const dir = path.join(__dirname, "../../deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(deploymentFile, JSON.stringify(existing, null, 2));

  console.log("\n=== Deployment complete ===");
  console.log("Proxy         :", proxyAddress);
  console.log("Total supply  :", ethers.formatUnits(await (token as any).totalSupply(), 18), "SGT916");
  console.log("Reserve grams :", (await goldReserve.getTotalActiveWeightGrams()).toString());
  console.log("Saved to      : deployments/localhost.json");

  // ── 10. Register with backend API ────────────────────────────────────────
  const API = "http://localhost:3001";
  console.log("\n==> Registering with backend API...");
  try {
    // Token
    const tokenRes = await fetch(`${API}/api/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address:                 proxyAddress,
        name:                    "Singapore Gold 916",
        symbol:                  "SGT916",
        decimals:                "18",
        deployer:                deployer.address,
        txHash:                  proxy.deploymentTransaction()?.hash ?? "0x0",
        complianceAddress:       complianceAddr,
        identityRegistryAddress: registryAddress,
        goldReserveAddress:      reserveAddress,
        purityStandard:          "916",
        custodianAddress:        custodian.address,
      }),
    });
    if (tokenRes.status === 409) {
      console.log("   Token already registered, skipping.");
    } else if (!tokenRes.ok) {
      console.warn("   Token registration failed:", await tokenRes.text());
    } else {
      console.log("   Token registered.");
    }

    // Gold bar
    const barRes = await fetch(`${API}/api/reserves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenAddress: proxyAddress,
        barId:        "GB916-2024-001",
        weightGrams:  500,
        purityBps:    9160,
        vaultId:      "Vault-SG-B",
        assayRef:     "ASSAY-SG-916",
      }),
    });
    if (barRes.status === 409 || barRes.status === 400) {
      console.log("   Bar already registered, skipping.");
    } else if (!barRes.ok) {
      console.warn("   Bar registration failed:", await barRes.text());
    } else {
      console.log("   Bar GB916-2024-001 registered.");
    }

    // KYC identities
    for (const [label, addr] of [
      ["deployer",  deployer.address],
      ["investor1", investor1.address],
      ["investor2", investor2.address],
    ] as [string, string][]) {
      const idRes = await fetch(`${API}/api/identities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, tokenAddress: proxyAddress, countryCode: "SG" }),
      });
      if (idRes.status === 409) {
        console.log(`   Identity ${label} already registered, skipping.`);
      } else if (!idRes.ok) {
        console.warn(`   Identity ${label} failed:`, await idRes.text());
      } else {
        console.log(`   Identity ${label} registered.`);
      }
    }

    console.log("==> Backend registration complete.");
  } catch {
    console.warn("==> Backend not reachable — skipping API registration.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
