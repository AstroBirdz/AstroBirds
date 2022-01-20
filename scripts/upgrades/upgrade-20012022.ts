// npx hardhat run scripts/upgrades/upgrade-20012022.ts --network bsctestnet

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

  // const psi = "0x6C31B672AB6B4D455608b33A11311cd1C9BdBA1C"; // bsc test
  const psi = "0x6e70194F3A2D1D0a917C2575B7e33cF710718a17"; // bsc main
  
  console.log("upgrading");
  
  let astroBirdsV2 = new ethers.Contract("0x9624cd2e91504692e120802e80a313f84847dc40", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // bsc main and test
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  astroBirdsV2 = await upgrades.upgradeProxy(astroBirdsV2.address, AstroBirdsV2) as AstroBirdsV2
  await astroBirdsV2.deployed();
  console.log("AstroBirdsV2 upgraded:", astroBirdsV2.address);
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
