// npx hardhat run scripts/deploy.ts --network bsctestnet

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers, upgrades } from "hardhat";

import { AstroBirdsV2 }  from '../typechain';

import AstroBirdsV2Abi from '../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'

const main = async() => {

  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  // const signer = ethers.provider.getSigner("0x26BbF93E659415654eCD9F5753e35F94b6185b64"); // bsc test
  const signer = ethers.provider.getSigner("0x3B7cB2006AB9F04816266CdFfaDB19210D074158"); // bsc main and test

  const marketing = "0x785ABe420B4214fd7cbF3F3d920d27122f7E1950"; // bsc test
  // const marketing = "0x3eBB59457D79c062B9D614Cd7177cA4B16EF8D11"; // bsc main

  const team = "0x722A804B654614Ed4626fDe81cD05F4556Bd7aCa"; // bsc test
  // const team = "0xdF752E3b80F65a1eadfD1507f0386A41D89F0C27"; // bsc main

  const psi = "0x25E77D7D0b6c449bb3C076af540cFE73ae80ad00"; // bsc test
  // const psi = "0x8a5BCE7AB4c38b0cab8A3dce349ffcC99DEdcaB4"; // bsc main

  const buyback = "0x12436081eEC476613b93705146E69ce562525d24"; // bsc test
  // const buyback = "0x96884298978Df1F0AFc1916a4d60170b8F35c88C"; // bsc main

  // const router: string = ""; // ganache
  const router: string = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // factory test pcs
  // const router: string = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // factory main pcs
  
  console.log("deploying");

  
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  const astroBirdsV2 = await upgrades.deployProxy(AstroBirdsV2, [
    "AstroBirdz",
    "ABZ",
    marketing,
    team,
    psi,
    buyback,
    router
  ], {initializer: 'initialize'}) as AstroBirdsV2;
  // let astroBirdsV2 = new ethers.Contract("0x9624cd2e91504692e120802e80a313f84847dc40", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // main
  // astroBirdsV2 = await upgrades.upgradeProxy("0x7B8A69B2D286b93C8510a4C7EE461749292e042b", AstroBirdsV2) as AstroBirdsV2
  await astroBirdsV2.deployed();
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
