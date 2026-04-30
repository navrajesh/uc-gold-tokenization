import { ethers } from "hardhat";
import {
  GoldToken,
  GoldReserve,
  IdentityRegistry,
  ModularCompliance,
  MaxWalletBalance,
  MinTransferAmount,
  CountryRestrictions,
} from "../typechain-types";

export const ONE_GRAM   = ethers.parseUnits("1",     18);
export const MAX_WALLET = ethers.parseUnits("10000", 18);

export async function deployGoldSystem() {
  const [deployer, custodian, investor1, investor2, stranger] = await ethers.getSigners();

  const identityRegistry = await (await ethers.getContractFactory("IdentityRegistry"))
    .deploy(deployer.address) as IdentityRegistry;

  const compliance = await (await ethers.getContractFactory("ModularCompliance"))
    .deploy(deployer.address) as ModularCompliance;

  const countryModule = await (await ethers.getContractFactory("CountryRestrictions"))
    .deploy(deployer.address) as unknown as CountryRestrictions;

  const maxWalletModule = await (await ethers.getContractFactory("MaxWalletBalance"))
    .deploy(deployer.address, MAX_WALLET) as MaxWalletBalance;

  const minTransferModule = await (await ethers.getContractFactory("MinTransferAmount"))
    .deploy(deployer.address, ONE_GRAM) as MinTransferAmount;

  await compliance.addModule(await countryModule.getAddress());
  await compliance.addModule(await maxWalletModule.getAddress());
  await compliance.addModule(await minTransferModule.getAddress());

  const goldReserve = await (await ethers.getContractFactory("GoldReserve"))
    .deploy(deployer.address, custodian.address) as GoldReserve;

  const GoldTokenFactory = await ethers.getContractFactory("GoldToken");
  const impl = await GoldTokenFactory.deploy();
  await impl.waitForDeployment();

  const initData = GoldTokenFactory.interface.encodeFunctionData("initialize", [
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

  const proxy = await (await ethers.getContractFactory("ERC1967Proxy"))
    .deploy(await impl.getAddress(), initData);
  await proxy.waitForDeployment();

  const token = GoldTokenFactory.attach(await proxy.getAddress()) as GoldToken;

  await identityRegistry.registerIdentity(deployer.address,  true);
  await identityRegistry.registerIdentity(investor1.address, true);
  await identityRegistry.registerIdentity(investor2.address, true);

  return {
    deployer, custodian, investor1, investor2, stranger,
    identityRegistry, compliance,
    countryModule, maxWalletModule, minTransferModule,
    goldReserve, token,
  };
}
