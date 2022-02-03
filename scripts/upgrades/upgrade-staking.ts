// npx hardhat run scripts/upgrades/upgrade-staking.ts --network bsctestnet

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers, upgrades, run } from "hardhat";

import { AstroBirdsV2, AstroBirdzStaking }  from '../../typechain';

import AstroBirdsV2Abi from '../../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'

const main = async() => {

  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0x3B7cB2006AB9F04816266CdFfaDB19210D074158"); // bsc main and test
  
  console.log("upgrading");
  
  let astroBirdsV2 = new ethers.Contract("0x9624cd2e91504692e120802e80a313f84847dc40", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // bsc main and test
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  astroBirdsV2 = await upgrades.upgradeProxy(astroBirdsV2.address, AstroBirdsV2) as AstroBirdsV2
  await astroBirdsV2.deployed();
  console.log("AstroBirdsV2 upgraded:", astroBirdsV2.address);

  // staking
  const AstroBirdzStaking = await ethers.getContractFactory("AstroBirdzStaking");
  const staking = await upgrades.deployProxy(AstroBirdzStaking, [
    astroBirdsV2.address,
    astroBirdsV2.address
  ], {initializer: 'initialize'}) as AstroBirdzStaking;
  await (await astroBirdsV2.excludeFromFeesAndDividends(staking.address)).wait()
  console.log("AstroBirdzStaking deployed:", staking.address);

  
  const abImplAddress = await upgrades.erc1967.getImplementationAddress(astroBirdsV2.address)
  console.log("AstroBirdsV2 implementation address:", abImplAddress);
  await run("verify:verify", { address: abImplAddress, constructorArguments: [] });
  console.log("AstroBirdsV2 implementation verified");

  const stakingImplAddress = await upgrades.erc1967.getImplementationAddress(staking.address)
  console.log("AstroBirdzStaking implementation address:", stakingImplAddress);
  await run("verify:verify", { address: stakingImplAddress, constructorArguments: [] });
  console.log("AstroBirdzStaking implementation verified");
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
