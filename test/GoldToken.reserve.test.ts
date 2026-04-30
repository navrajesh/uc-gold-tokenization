import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployGoldSystem, ONE_GRAM } from "./fixtures";

describe("GoldToken — reserve cap & bar management", function () {

  // ── Mint reserve cap ─────────────────────────────────────────────────────────

  it("blocks mint when no gold bars are registered", async function () {
    const { token, investor1 } = await loadFixture(deployGoldSystem);
    await expect(token.mint(investor1.address, ONE_GRAM))
      .to.be.revertedWith("GoldToken: mint would exceed vault reserve");
  });

  it("allows mint up to the registered reserve", async function () {
    const { token, deployer, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const mintAmt = ethers.parseUnits("100", 18);
    await expect(token.mint(deployer.address, mintAmt)).to.not.be.reverted;
    expect(await token.totalSupply()).to.equal(mintAmt);
  });

  it("blocks mint that exceeds the reserve", async function () {
    const { token, deployer, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await expect(token.mint(deployer.address, ethers.parseUnits("101", 18)))
      .to.be.revertedWith("GoldToken: mint would exceed vault reserve");
  });

  // ── Bar deactivation ─────────────────────────────────────────────────────────

  it("deactivating a bar tightens the reserve cap", async function () {
    const { token, deployer, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("50", 18));

    await goldReserve.connect(custodian).deactivateBar("GB-001");

    await expect(token.mint(deployer.address, ONE_GRAM))
      .to.be.revertedWith("GoldToken: mint would exceed vault reserve");
  });

  it("non-custodian cannot deactivate a bar", async function () {
    const { goldReserve, custodian, stranger } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await expect(goldReserve.connect(stranger).deactivateBar("GB-001")).to.be.reverted;
  });

  it("deactivating an already-inactive bar reverts", async function () {
    const { goldReserve, custodian } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await goldReserve.connect(custodian).deactivateBar("GB-001");
    await expect(goldReserve.connect(custodian).deactivateBar("GB-001"))
      .to.be.revertedWith("GoldReserve: bar not active");
  });

  // ── batchMint ────────────────────────────────────────────────────────────────

  it("batchMint distributes to multiple recipients", async function () {
    const { token, deployer, investor1, investor2, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const amt = ethers.parseUnits("10", 18);
    await token.batchMint([deployer.address, investor1.address, investor2.address], [amt, amt, amt]);
    expect(await token.balanceOf(deployer.address)).to.equal(amt);
    expect(await token.balanceOf(investor1.address)).to.equal(amt);
    expect(await token.balanceOf(investor2.address)).to.equal(amt);
    expect(await token.totalSupply()).to.equal(amt * 3n);
  });

  it("batchMint enforces reserve cap on the combined total", async function () {
    const { token, deployer, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 10, 9999, "Vault-A", "ASSAY-001");
    const sixGrams = ethers.parseUnits("6", 18);
    await expect(token.batchMint([deployer.address, investor1.address], [sixGrams, sixGrams]))
      .to.be.revertedWith("GoldToken: mint would exceed vault reserve");
  });

  it("batchMint reverts on array length mismatch", async function () {
    const { token, deployer, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await expect(token.batchMint([deployer.address, investor1.address], [ONE_GRAM]))
      .to.be.revertedWith("Token: length mismatch");
  });
});
