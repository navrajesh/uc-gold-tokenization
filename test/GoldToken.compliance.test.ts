import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployGoldSystem, ONE_GRAM } from "./fixtures";

describe("GoldToken — compliance modules", function () {

  // ── Minimum transfer amount ──────────────────────────────────────────────────

  it("blocks transfer below 1g minimum", async function () {
    const { token, deployer, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await expect(token.transfer(investor1.address, ONE_GRAM - 1n))
      .to.be.revertedWith("Token: compliance rejected");
  });

  it("setMinAmount — lowering threshold allows previously blocked amount", async function () {
    const { token, deployer, investor1, minTransferModule, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    const half = ONE_GRAM / 2n;
    await expect(token.transfer(investor1.address, half)).to.be.revertedWith("Token: compliance rejected");
    await minTransferModule.setMinAmount(half);
    await expect(token.transfer(investor1.address, half)).to.not.be.reverted;
  });

  // ── Max wallet balance ───────────────────────────────────────────────────────

  it("blocks transfer that would push receiver over max wallet", async function () {
    const { token, deployer, investor1, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 10001, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10001", 18));
    await expect(token.transfer(investor1.address, ethers.parseUnits("10001", 18)))
      .to.be.revertedWith("Token: compliance rejected");
  });

  it("setMaxBalance — raising the cap allows previously blocked transfer", async function () {
    const { token, deployer, investor1, maxWalletModule, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 10001, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10001", 18));
    await expect(token.transfer(investor1.address, ethers.parseUnits("10001", 18)))
      .to.be.revertedWith("Token: compliance rejected");
    await maxWalletModule.setMaxBalance(ethers.parseUnits("20000", 18));
    await expect(token.transfer(investor1.address, ethers.parseUnits("10001", 18))).to.not.be.reverted;
  });

  // ── Country whitelist ────────────────────────────────────────────────────────

  it("when country whitelist is enabled, blocks all transfers (POC)", async function () {
    const { token, deployer, investor1, countryModule, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    await countryModule.setWhitelistEnabled(true);
    await expect(token.transfer(investor1.address, ONE_GRAM))
      .to.be.revertedWith("Token: compliance rejected");
  });

  // ── Module removal ───────────────────────────────────────────────────────────

  it("removing minTransfer module allows sub-gram transfers", async function () {
    const { token, deployer, investor1, compliance, minTransferModule, custodian, goldReserve } = await loadFixture(deployGoldSystem);
    await goldReserve.connect(custodian).registerBar("GB-001", 100, 9999, "Vault-A", "ASSAY-001");
    await token.mint(deployer.address, ethers.parseUnits("10", 18));
    const belowMin = ONE_GRAM - 1n;
    await expect(token.transfer(investor1.address, belowMin)).to.be.revertedWith("Token: compliance rejected");
    await compliance.removeModule(await minTransferModule.getAddress());
    await expect(token.transfer(investor1.address, belowMin)).to.not.be.reverted;
  });
});
