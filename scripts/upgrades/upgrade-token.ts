// npx hardhat run scripts/upgrades/upgrade-token.ts --network bsctestnet

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers, upgrades, run } from "hardhat";

import { AstroBirdsV2, AstroBirdzDividendTracker }  from '../../typechain';

import AstroBirdsV2Abi from '../../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'
import AstroBirdzDividendTrackerAbi from '../../artifacts/contracts/AstroBirdzDividendTracker.sol/AstroBirdzDividendTracker.json'
import { solidity } from "ethereum-waffle";
import { solidityPack } from "ethers/lib/utils";

const main = async() => {

  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0x3B7cB2006AB9F04816266CdFfaDB19210D074158"); // bsc main and test

  const psi = "0x6C31B672AB6B4D455608b33A11311cd1C9BdBA1C"; // bsc test
  // const psi = "0x6e70194F3A2D1D0a917C2575B7e33cF710718a17"; // bsc main
  
  console.log("upgrading");
  
  let astroBirdsV2 = new ethers.Contract("0x9624cd2e91504692e120802e80a313f84847dc40", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // bsc main and test
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  astroBirdsV2 = await upgrades.upgradeProxy(astroBirdsV2.address, AstroBirdsV2) as AstroBirdsV2
  await astroBirdsV2.deployed();
  console.log("AstroBirdsV2 upgraded:", astroBirdsV2.address);

  const dividendTracker = new ethers.Contract("0xe520E54598757CF2e35B9e02210b75309e3b8091", AstroBirdzDividendTrackerAbi.abi, signer) as AstroBirdzDividendTracker; // test
  // const dividendTracker = new ethers.Contract("0xe9600b7a2dff8a806c88ec8a9aa0f5823d083309", AstroBirdzDividendTrackerAbi.abi, signer) as AstroBirdzDividendTracker; // main
  // const AstroBirdzDividendTracker = await ethers.getContractFactory("AstroBirdzDividendTracker");
  // const dividendTracker = await AstroBirdzDividendTracker.connect(signer).deploy(psi, astroBirdsV2.address) as AstroBirdzDividendTracker;
  // await dividendTracker.deployed();
  console.log("AstroBirdzDividendTracker deployed to:", dividendTracker.address);

  // await (await astroBirdsV2.initPSIDividendTracker(dividendTracker.address)).wait()
  // console.log("AstroBirdzDividendTracker initialized");

  const implAddress = await upgrades.erc1967.getImplementationAddress(astroBirdsV2.address)
  console.log("AstroBirdsV2 implementation address:", implAddress);
  await run("verify:verify", { address: implAddress, constructorArguments: [] });
  console.log("AstroBirdsV2 implementation verified");
  // await run("verify:verify", { address: dividendTracker.address, constructorArguments: [psi, astroBirdsV2.address] });
  // console.log("AstroBirdzDividendTracker verified");

  // const holders = [
  //   "0x3b7cb2006ab9f04816266cdffadb19210d074158",
  //   "0x4d28fb1b11d297a3b739e7bbaf17b9c3cafc5cbc",
  //   "0xd5244825e722ffcee1568a58ed48a7b1ba1ce0a0",
  //   "0xef28ae052a2395d72bfdeede3522de5264c705ee",
  //   "0xfe075e5dc0418041d1d8368007c86e6a38528339"
  // ]
  // const holdersData = holders.map((h, idx) => solidityPack(["address"], [h]).substr(idx === 0 ? 0 : 2)).join('')
  // await (await dividendTracker.ensureBalanceForUsers(holdersData, false)).wait()
  // console.log("AstroBirdzDividendTracker balances ensured:", dividendTracker.address);
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
