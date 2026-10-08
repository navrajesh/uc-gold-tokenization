import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const signers = await ethers.getSigners();
  const deployer  = signers[0];
  const custodian = signers[1];
  if (!deployer || !custodian) {
    throw new Error("Deployment requires DEPLOYER_PRIVATE_KEY and CUSTODIAN_PRIVATE_KEY");
  }

  const investor1Address = process.env.DEMO_INVESTOR_1_ADDRESS ?? signers[2]?.address;
  const investor2Address = process.env.DEMO_INVESTOR_2_ADDRESS ?? signers[3]?.address;
  if (!investor1Address || !investor2Address) {
    throw new Error("Set DEMO_INVESTOR_1_ADDRESS and DEMO_INVESTOR_2_ADDRESS");
  }

  console.log("=== Gold Token Deployment ===");
  console.log("Deployer  :", deployer.address);
  console.log("Custodian :", custodian.address);
  console.log("Investor1 :", investor1Address);
  console.log("Investor2 :", investor2Address);
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

  // ── 3. Compliance modules ─────────────────────────────────────────────────
  const ONE_GRAM   = ethers.parseUnits("1",     18); // 1g minimum transfer
  const MAX_WALLET = ethers.parseUnits("10000", 18); // 10,000g max per wallet

  const CountryRestrictions = await ethers.getContractFactory("CountryRestrictions");
  const countryModule = await CountryRestrictions.deploy(deployer.address);
  await countryModule.waitForDeployment();

  const MaxWalletBalance = await ethers.getContractFactory("MaxWalletBalance");
  const maxWalletModule = await MaxWalletBalance.deploy(deployer.address, MAX_WALLET);
  await maxWalletModule.waitForDeployment();

  const MinTransferAmount = await ethers.getContractFactory("MinTransferAmount");
  const minTransferModule = await MinTransferAmount.deploy(deployer.address, ONE_GRAM);
  await minTransferModule.waitForDeployment();

  console.log("CountryRestrictions :", await countryModule.getAddress());
  console.log("MaxWalletBalance    :", await maxWalletModule.getAddress());
  console.log("MinTransferAmount   :", await minTransferModule.getAddress());

  // Wire modules into compliance (all three active for SGT999)
  await (await compliance.addModule(await countryModule.getAddress())).wait();
  await (await compliance.addModule(await maxWalletModule.getAddress())).wait();
  await (await compliance.addModule(await minTransferModule.getAddress())).wait();
  console.log("Compliance modules wired");

  // ── 4. GoldReserve ────────────────────────────────────────────────────────
  const GoldReserve = await ethers.getContractFactory("GoldReserve");
  const goldReserve = await GoldReserve.deploy(deployer.address, custodian.address);
  await goldReserve.waitForDeployment();
  console.log("GoldReserve         :", await goldReserve.getAddress());

  // ── 5. GoldToken (UUPS proxy) ─────────────────────────────────────────────
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const impl = await GoldToken.deploy();
  await impl.waitForDeployment();

  const initData = GoldToken.interface.encodeFunctionData("initialize", [
    await identityRegistry.getAddress(),
    await compliance.getAddress(),
    "Singapore Fine Gold",
    "SGT999",
    18,
    ethers.ZeroAddress,        // onchainID — not used in POC
    deployer.address,           // admin
    "999.9",                    // purityStandard
    await goldReserve.getAddress(),
    custodian.address,
  ]);

  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(await impl.getAddress(), initData);
  await proxy.waitForDeployment();

  const token = GoldToken.attach(await proxy.getAddress());
  console.log("GoldToken impl      :", await impl.getAddress());
  console.log("GoldToken proxy     :", await proxy.getAddress());

  // ── 6. KYC register demo investors ───────────────────────────────────────
  await (await identityRegistry.registerIdentity(investor1Address, true)).wait();
  await (await identityRegistry.registerIdentity(investor2Address, true)).wait();
  await (await identityRegistry.registerIdentity(deployer.address,  true)).wait();
  console.log("KYC registered: deployer, investor1, investor2");

  // ── 7. Register a demo gold bar (custodian) ───────────────────────────────
  const reserveAsCustodian = goldReserve.connect(custodian) as any;
  const barTx = await reserveAsCustodian.registerBar(
    "GB-2024-001",
    1000,           // 1,000 grams
    9999,           // 999.9 purity (bps)
    "Vault-SG-A",
    "ASSAY-SG-001",
  );
  const barReceipt = await barTx.wait();
  console.log("Bar registered: GB-2024-001 (1,000g, 999.9 purity)");

  // ── 8. Mint initial tokens to issuer ─────────────────────────────────────
  const MINT_AMOUNT = ethers.parseUnits("1000", 18); // 1,000 SGT999
  await (await (token as any).mint(deployer.address, MINT_AMOUNT)).wait();
  console.log("Minted 1,000 SGT999 to issuer:", deployer.address);

  await (await (token as any).transfer(investor1Address, ethers.parseUnits("100", 18))).wait();
  await (await (token as any).transfer(investor2Address, ethers.parseUnits("75", 18))).wait();
  console.log("Distributed 100 SGT999 to investor1 and 75 SGT999 to investor2");

  // ── 9. Save deployment addresses ─────────────────────────────────────────
  const proxyAddress    = await proxy.getAddress();
  const reserveAddress  = await goldReserve.getAddress();
  const registryAddress = await identityRegistry.getAddress();
  const complianceAddr  = await compliance.getAddress();

  const chain = await ethers.provider.getNetwork();
  const output = {
    network: network.name,
    chainId: Number(chain.chainId),
    deployedAt: new Date().toISOString(),
    tokens: {
      SGT999: {
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
      },
    },
    accounts: {
      deployer:  deployer.address,
      custodian: custodian.address,
      investor1: investor1Address,
      investor2: investor2Address,
    },
  };

  const dir = path.join(__dirname, "../../deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(output, null, 2));

  console.log("\n=== Deployment complete ===");
  console.log("Proxy         :", proxyAddress);
  console.log("Total supply  :", ethers.formatUnits(await (token as any).totalSupply(), 18), "SGT999");
  console.log("Reserve grams :", (await goldReserve.getTotalActiveWeightGrams()).toString());
  console.log(`Saved to      : deployments/${network.name}.json`);

  // ── 10. Register with backend API ────────────────────────────────────────
  const API = process.env.DEMO_API_URL ?? "http://localhost:3001";
  const seedToken = process.env.DEMO_SEED_TOKEN ?? "";
  const headers = {
    "Content-Type": "application/json",
    ...(seedToken ? { "x-demo-seed-token": seedToken } : {}),
  };
  console.log("\n==> Registering with backend API...");
  try {
    // Token
    const tokenRes = await fetch(`${API}/api/tokens`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        address:                 proxyAddress,
        name:                    "Singapore Fine Gold",
        symbol:                  "SGT999",
        decimals:                "18",
        deployer:                deployer.address,
        txHash:                  proxy.deploymentTransaction()?.hash ?? "0x0",
        complianceAddress:       complianceAddr,
        identityRegistryAddress: registryAddress,
        goldReserveAddress:      reserveAddress,
        purityStandard:          "999.9",
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
    const barRes = await fetch(`${API}/api/reserves/import`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tokenAddress: proxyAddress,
        barId:        "GB-2024-001",
        weightGrams:  1000,
        purityBps:    9999,
        vaultId:      "Vault-SG-A",
        custodian:    custodian.address,
        assayRef:     "ASSAY-SG-001",
        txHash:       barReceipt?.hash ?? barTx.hash,
      }),
    });
    if (barRes.status === 409 || barRes.status === 400) {
      console.log("   Bar already registered, skipping.");
    } else if (!barRes.ok) {
      console.warn("   Bar registration failed:", await barRes.text());
    } else {
      console.log("   Bar GB-2024-001 registered.");
    }

    // KYC identities
    for (const [label, addr] of [
      ["deployer",  deployer.address],
      ["investor1", investor1Address],
      ["investor2", investor2Address],
    ] as [string, string][]) {
      const idRes = await fetch(`${API}/api/identities`, {
        method: "POST",
        headers,
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
    console.warn("    Start the backend and run: scripts/bat/register-token.bat");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
