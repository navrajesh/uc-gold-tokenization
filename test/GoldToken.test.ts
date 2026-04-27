import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  GoldToken,
  GoldReserve,
  IdentityRegistry,
  ModularCompliance,
  MaxWalletBalance,
  MinTransferAmount,
} from "../typechain-types";

describe("GoldToken", function () {
  let deployer:  HardhatEthersSigner;
  let custodian: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;
  let stranger:  HardhatEthersSigner;

  let identityRegistry: IdentityRegistry;
  let compliance:       ModularCompliance;
  let maxWalletModule:  MaxWalletBalance;
  let minTransferModule: MinTransferAmount;
  let goldReserve:      GoldReserve;
  let token:            GoldToken;

  const ONE_GRAM   = ethers.parseUnits("1",     18);
  const MAX_WALLET = ethers.parseUnits("10000", 18);

  beforeEach(async function () {
    [deployer, custodian, investor1, investor2, stranger] = await ethers.getSigners();

    // Deploy infrastructure
    identityRegistry = await (await ethers.getContractFactory("IdentityRegistry"))
      .deploy(deployer.address) as IdentityRegistry;

    compliance = await (await ethers.getContractFactory("ModularCompliance"))
      .deploy(deployer.address) as ModularCompliance;

    const countryModule = await (await ethers.getContractFactory("CountryRestrictions"))
      .deploy(deployer.address);

    maxWalletModule = await (await ethers.getContractFactory("MaxWalletBalance"))
      .deploy(deployer.address, MAX_WALLET) as MaxWalletBalance;

    minTransferModule = await (await ethers.getContractFactory("MinTransferAmount"))
      .deploy(deployer.address, ONE_GRAM) as MinTransferAmount;

    await compliance.addModule(await countryModule.getAddress());
    await compliance.addModule(await maxWalletModule.getAddress());
    await compliance.addModule(await minTransferModule.getAddress());

    goldReserve = await (await ethers.getContractFactory("GoldReserve"))
      .deploy(deployer.address, custodian.address) as GoldReserve;

    // Deploy GoldToken via UUPS proxy
    const GoldToken = await ethers.getContractFactory("GoldToken");
    const impl = await GoldToken.deploy();
    await impl.waitForDeployment();

    const initData = GoldToken.interface.encodeFunctionData("initialize", [
      await identityRegistry.getAddress(),
      await compliance.getAddress(),
      "Singapore Fine Gold",
      "SGT999",
      18,
      ethers.ZeroAddress,
      deployer.address,
      "999.9",
      await goldReserve.getAddress(),
      custodian.address,
    ]);

    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await ERC1967Proxy.deploy(await impl.getAddress(), initData);
    await proxy.waitForDeployment();

    token = GoldToken.attach(await proxy.getAddress()) as GoldToken;

    // KYC register investor1, investor2, and deployer (issuer needs it to receive tokens)
    await identityRegistry.registerIdentity(deployer.address,  true);
    await identityRegistry.registerIdentity(investor1.address, true);
    await identityRegistry.registerIdentity(investor2.address, true);
  });

  // ── Reserve cap ─────────────────────────────────────────────────────────────

  it("blocks mint when no gold bars are registered", async function () {
    await expect(
      token.mint(investor1.address, ONE_GRAM)
    ).to.be.revertedWith("GoldToken: mint would exceed vault reserve");
  });

  it("allows mint up to registered reserve", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const mintAmount = ethers.parseUnits("100", 18); // exactly 100 grams
    await expect(token.mint(deployer.address, mintAmount)).to.not.be.reverted;
    expect(await token.totalSupply()).to.equal(mintAmount);
  });

  it("blocks mint exceeding the reserve", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const overMint = ethers.parseUnits("101", 18); // 101 grams, only 100 registered
    await expect(
      token.mint(deployer.address, overMint)
    ).to.be.revertedWith("GoldToken: mint would exceed vault reserve");
  });

  // ── KYC gating ──────────────────────────────────────────────────────────────

  it("blocks transfer to unverified wallet", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));

    await expect(
      token.transfer(stranger.address, ONE_GRAM)
    ).to.be.revertedWith("Token: recipient not verified");
  });

  it("allows transfer between two verified wallets", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));

    await expect(token.transfer(investor1.address, ONE_GRAM)).to.not.be.reverted;
    expect(await token.balanceOf(investor1.address)).to.equal(ONE_GRAM);
  });

  // ── Minimum transfer amount ──────────────────────────────────────────────────

  it("blocks transfer below minimum (less than 1g)", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));

    const belowMin = ONE_GRAM - 1n;
    await expect(
      token.transfer(investor1.address, belowMin)
    ).to.be.revertedWith("Token: compliance rejected");
  });

  // ── Max wallet balance ───────────────────────────────────────────────────────

  it("blocks transfer that would push receiver over max wallet", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 10001, 9999, "Vault-A", "ASSAY-001");
    // Mint 10,001 grams to deployer (who is also KYC'd, and their balance tracking starts at 0)
    await token.mint(deployer.address, ethers.parseUnits("10001", 18));

    // Try to transfer 10,001g — would put investor1 over the 10,000g cap
    await expect(
      token.transfer(investor1.address, ethers.parseUnits("10001", 18))
    ).to.be.revertedWith("Token: compliance rejected");
  });

  // ── Redemption ───────────────────────────────────────────────────────────────

  it("emits RedemptionRequested event", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));

    await expect(
      token.connect(investor1).requestRedemption(5, "123 Gold St, Singapore")
    )
      .to.emit(token, "RedemptionRequested")
      .withArgs(investor1.address, 5, "123 Gold St, Singapore", await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
  });

  it("custodian fulfills redemption — burns tokens", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const mintAmt = ethers.parseUnits("10", 18);
    await token.mint(investor1.address, mintAmt);

    const burnAmt = ethers.parseUnits("5", 18);
    const before  = await token.totalSupply();

    await expect(
      token.connect(custodian).fulfillRedemption(investor1.address, burnAmt, "RDM-001")
    )
      .to.emit(token, "RedemptionFulfilled")
      .withArgs(investor1.address, burnAmt, "RDM-001");

    expect(await token.totalSupply()).to.equal(before - burnAmt);
    expect(await token.balanceOf(investor1.address)).to.equal(mintAmt - burnAmt);
  });

  it("non-custodian cannot fulfill redemption", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));

    await expect(
      token.connect(stranger).fulfillRedemption(investor1.address, ONE_GRAM, "RDM-001")
    ).to.be.reverted;
  });

  // ── Proof of reserve ─────────────────────────────────────────────────────────

  it("reserve ratio stays 1:1 after redemption burn", async function () {
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const mintAmt = ethers.parseUnits("100", 18);
    await token.mint(deployer.address, mintAmt);

    // Burn 10g via fulfillRedemption
    const burnAmt = ethers.parseUnits("10", 18);
    await token.connect(custodian).fulfillRedemption(deployer.address, burnAmt, "RDM-001");

    const supply = await token.totalSupply();
    const reserveGrams = await goldReserve.getTotalActiveWeightGrams();

    // Supply (90g) should be ≤ reserve (still 100g in vault — bar deactivation is separate)
    expect(supply).to.be.lte(reserveGrams * ethers.parseUnits("1", 18));
  });
});
