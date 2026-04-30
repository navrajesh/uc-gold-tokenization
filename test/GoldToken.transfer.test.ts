import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployGoldSystem, ONE_GRAM } from "./fixtures";

describe("GoldToken — transfers", function () {

  // ── KYC gating ───────────────────────────────────────────────────────────────

  it("blocks transfer to unverified wallet", async function () {
    const { token, deployer, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await expect(token.transfer(stranger.address, ONE_GRAM))
      .to.be.revertedWith("Token: recipient not verified");
  });

  it("allows transfer between two verified wallets", async function () {
    const { token, deployer, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await expect(token.transfer(investor1.address, ONE_GRAM)).to.not.be.reverted;
    expect(await token.balanceOf(investor1.address)).to.equal(ONE_GRAM);
  });

  // ── KYC revocation ───────────────────────────────────────────────────────────

  it("revoking KYC blocks incoming transfers", async function () {
    const { token, deployer, investor1, identityRegistry, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await identityRegistry.registerIdentity(investor1.address, false);
    await expect(token.transfer(investor1.address, ONE_GRAM))
      .to.be.revertedWith("Token: recipient not verified");
  });

  // ── Freeze ───────────────────────────────────────────────────────────────────

  it("blocks transfer from a frozen sender", async function () {
    const { token, deployer, investor1, investor2, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await token.transfer(investor1.address, ONE_GRAM);
    await token.setAddressFrozen(investor1.address, true);
    await expect(token.connect(investor1).transfer(investor2.address, ONE_GRAM))
      .to.be.revertedWith("Token: sender frozen");
  });

  it("blocks transfer to a frozen recipient", async function () {
    const { token, deployer, investor2, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await token.setAddressFrozen(investor2.address, true);
    await expect(token.transfer(investor2.address, ONE_GRAM))
      .to.be.revertedWith("Token: recipient frozen");
  });

  it("unfreezing restores transfer ability", async function () {
    const { token, deployer, investor1, investor2, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await token.transfer(investor1.address, ONE_GRAM);
    await token.setAddressFrozen(investor1.address, true);
    await token.setAddressFrozen(investor1.address, false);
    await expect(token.connect(investor1).transfer(investor2.address, ONE_GRAM)).to.not.be.reverted;
  });

  it("non-FREEZER cannot freeze an address", async function () {
    const { token, investor1, stranger } = await loadFixture(deployGoldSystem);
    await expect(token.connect(stranger).setAddressFrozen(investor1.address, true)).to.be.reverted;
  });

  // ── transferFrom ─────────────────────────────────────────────────────────────

  it("transferFrom succeeds with prior approval", async function () {
    const { token, deployer, investor1, investor2, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await token.connect(investor1).approve(deployer.address, ONE_GRAM);
    await expect(token.transferFrom(investor1.address, investor2.address, ONE_GRAM)).to.not.be.reverted;
    expect(await token.balanceOf(investor2.address)).to.equal(ONE_GRAM);
  });

  it("transferFrom blocks if recipient is not KYC-verified", async function () {
    const { token, deployer, investor1, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await token.connect(investor1).approve(deployer.address, ONE_GRAM);
    await expect(token.transferFrom(investor1.address, stranger.address, ONE_GRAM))
      .to.be.revertedWith("Token: recipient not verified");
  });

  // ── forcedTransfer ───────────────────────────────────────────────────────────

  it("forcedTransfer bypasses sender freeze", async function () {
    const { token, investor1, investor2, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await token.setAddressFrozen(investor1.address, true);
    await expect(token.forcedTransfer(investor1.address, investor2.address, ONE_GRAM)).to.not.be.reverted;
    expect(await token.balanceOf(investor2.address)).to.equal(ONE_GRAM);
  });

  it("forcedTransfer bypasses KYC — can send to unverified address", async function () {
    const { token, investor1, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await expect(token.forcedTransfer(investor1.address, stranger.address, ONE_GRAM)).to.not.be.reverted;
    expect(await token.balanceOf(stranger.address)).to.equal(ONE_GRAM);
  });

  it("non-AGENT_ROLE cannot force-transfer", async function () {
    const { token, investor1, investor2, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await expect(token.connect(stranger).forcedTransfer(investor1.address, investor2.address, ONE_GRAM))
      .to.be.reverted;
  });
});
