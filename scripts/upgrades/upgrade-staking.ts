// npx hardhat run scripts/upgrades/upgrade-staking.ts --network bsctestnet

require("dotenv").config({path: `${__dirname}/.env`});
import { ethers, upgrades, run } from "hardhat";

import { AstroBirdsV2, AstroBirdzStaking }  from '../../typechain';

import AstroBirdsV2Abi from '../../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'
import AstroBirdzStakingAbi from '../../artifacts/contracts/AstroBirdzStaking.sol/AstroBirdzStaking.json'

const main = async() => {

  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  // const signer = ethers.provider.getSigner("0x3B7cB2006AB9F04816266CdFfaDB19210D074158"); // bsc main and test old
  const signer = ethers.provider.getSigner("0x7d9F9B5C9BfacAacA6dDB095e3E09E514A112199"); // bsc main and test
  
  console.log("upgrading");
  
  let astroBirdsV2 = new ethers.Contract("0x7f3E9bdB55a0fA72BD6025C0ee1dfC3276cE3CF9", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // bsc main and test
  // const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2", signer);
  // astroBirdsV2 = await upgrades.upgradeProxy(astroBirdsV2.address, AstroBirdsV2) as AstroBirdsV2
  // await astroBirdsV2.deployed();
  // console.log("AstroBirdsV2 upgraded:", astroBirdsV2.address);

  // staking
  // let staking = new ethers.Contract("0x49ae07126cd7fdc1e4be57bdc9eee6065ecee5e6", AstroBirdzStakingAbi.abi, signer) as AstroBirdzStaking; // bsc test old
  // let staking = new ethers.Contract("0x6bAf0fC5A1237cdb7d346Ff8115277502C4eBb54", AstroBirdzStakingAbi.abi, signer) as AstroBirdzStaking; // bsc test
  let staking = new ethers.Contract("0x26acfbF060d2Ca49F50d7793b22633fd8DFa28E5", AstroBirdzStakingAbi.abi, signer) as AstroBirdzStaking; // bsc main
  // const AstroBirdzStaking = await ethers.getContractFactory("AstroBirdzStaking", signer);
  // staking = await upgrades.upgradeProxy(staking.address, AstroBirdzStaking) as AstroBirdzStaking
  // const staking = await upgrades.deployProxy(AstroBirdzStaking, [
  //   astroBirdsV2.address,
  //   astroBirdsV2.address
  // ], {initializer: 'initialize'}) as AstroBirdzStaking;
  // await staking.deployed();
  // await (await astroBirdsV2.excludeFromFeesAndDividends(staking.address)).wait()
  // await (await astroBirdsV2.addMinter(staking.address)).wait()
  console.log("AstroBirdzStaking deployed:", staking.address);
  console.log(`[[${(await staking.allConfiguredLocks()).map(l => `[${l[0]},${l[1]}]`).join(",")}]]`)
  
  // const abImplAddress = await upgrades.erc1967.getImplementationAddress(astroBirdsV2.address)
  // console.log("AstroBirdsV2 implementation address:", abImplAddress);
  // await run("verify:verify", { address: abImplAddress, constructorArguments: [] });
  // console.log("AstroBirdsV2 implementation verified");

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
