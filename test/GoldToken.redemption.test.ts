import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployGoldSystem, ONE_GRAM } from "./fixtures";

describe("GoldToken — redemption & access control", function () {

  // ── Redemption lifecycle ─────────────────────────────────────────────────────

  it("emits RedemptionRequested event", async function () {
    const { token, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await expect(token.connect(investor1).requestRedemption(5, "123 Gold St, Singapore"))
      .to.emit(token, "RedemptionRequested")
      .withArgs(
        investor1.address, 5, "123 Gold St, Singapore",
        await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
      );
  });

  it("custodian fulfills redemption and burns tokens", async function () {
    const { token, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    const mintAmt = ethers.parseUnits("10", 18);
    const burnAmt = ethers.parseUnits("5",  18);
    await token.mint(investor1.address, mintAmt);
    const supplyBefore = await token.totalSupply();
    await expect(token.connect(custodian).fulfillRedemption(investor1.address, burnAmt, "RDM-001"))
      .to.emit(token, "RedemptionFulfilled")
      .withArgs(investor1.address, burnAmt, "RDM-001");
    expect(await token.totalSupply()).to.equal(supplyBefore - burnAmt);
    expect(await token.balanceOf(investor1.address)).to.equal(mintAmt - burnAmt);
  });

  it("non-custodian cannot fulfill redemption", async function () {
    const { token, investor1, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(investor1.address, ethers.parseUnits("10", 18));
    await expect(token.connect(stranger).fulfillRedemption(investor1.address, ONE_GRAM, "RDM-001"))
      .to.be.reverted;
  });

  // ── Proof of reserve ─────────────────────────────────────────────────────────

  it("supply stays within reserve after a redemption burn", async function () {
    const { token, deployer, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("100", 18));
    await token.connect(custodian).fulfillRedemption(deployer.address, ethers.parseUnits("10", 18), "RDM-001");
    const supply       = await token.totalSupply();
    const reserveGrams = await goldReserve.getTotalActiveWeightGrams();
    expect(supply).to.be.lte(reserveGrams * ethers.parseUnits("1", 18));
  });

  // ── Access control ───────────────────────────────────────────────────────────

  it("non-SUPPLY_MODIFIER cannot mint", async function () {
    const { token, investor1, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await expect(token.connect(stranger).mint(investor1.address, ONE_GRAM)).to.be.reverted;
  });

  it("non-SUPPLY_MODIFIER cannot batchMint", async function () {
    const { token, investor1, stranger, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await expect(token.connect(stranger).batchMint([investor1.address], [ONE_GRAM])).to.be.reverted;
  });

  it("non-DEFAULT_ADMIN_ROLE cannot call setGoldReserve", async function () {
    const { token, stranger, goldReserve } = await loadFixture(deployGoldSystem);
    await expect(token.connect(stranger).setGoldReserve(await goldReserve.getAddress())).to.be.reverted;
  });

  it("non-owner cannot register identity", async function () {
    const { identityRegistry, stranger } = await loadFixture(deployGoldSystem);
    await expect(identityRegistry.connect(stranger).registerIdentity(stranger.address, true))
      .to.be.revertedWith("IdentityRegistry: not owner");
  });
});
