// npx hardhat run scripts/deploy.ts --network bsctestnet

require("dotenv").config({path: `${__dirname}/.env`});
import { run, ethers, upgrades } from "hardhat";

import { AstroBirdsV2, AstroBirdzStaking, AstroBirdzDividendTracker }  from '../typechain';

import AstroBirdsV2Abi from '../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'
import AstroBirdzDividendTrackerAbi from '../artifacts/contracts/AstroBirdzDividendTracker.sol/AstroBirdzDividendTracker.json'
import AstroBirdzStakingAbi from '../artifacts/contracts/AstroBirdzStaking.sol/AstroBirdzStaking.json'

const main = async() => {

  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  // const signer = ethers.provider.getSigner("0x26BbF93E659415654eCD9F5753e35F94b6185b64"); // bsc test
  const signer = ethers.provider.getSigner("0x7d9F9B5C9BfacAacA6dDB095e3E09E514A112199"); // bsc main and test

  // const marketing = "0x785ABe420B4214fd7cbF3F3d920d27122f7E1950"; // bsc test
  const marketing = "0x29A25D6E75013d05609c83596d7Daa3d573b0C0c"; // bsc main

  // const team = "0x722A804B654614Ed4626fDe81cD05F4556Bd7aCa"; // bsc test
  const team = "0x34ED0F528ee4A23296b3B1e38DE7AA2A55b85B0F"; // bsc main

  // const psi = "0x6C31B672AB6B4D455608b33A11311cd1C9BdBA1C"; // bsc test
  const psi = "0x6e70194F3A2D1D0a917C2575B7e33cF710718a17"; // bsc main

  // const buyback = "0x12436081eEC476613b93705146E69ce562525d24"; // bsc test
  const buyback = "0x50056881B16887501534c994d6A2c9Fee7677662"; // bsc main

  // const router: string = ""; // ganache
  // const router: string = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // factory test pcs
  const router: string = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // factory main pcs
  
  console.log("deploying");

  
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  // let astroBirdsV2 = new ethers.Contract("0x26acfbF060d2Ca49F50d7793b22633fd8DFa28E5", AstroBirdsV2Abi.abi, signer) as AstroBirdsV2; // bsc main and test
  // astroBirdsV2 = await upgrades.upgradeProxy(astroBirdsV2.address, AstroBirdsV2) as AstroBirdsV2
  const astroBirdsV2 = await upgrades.deployProxy(AstroBirdsV2, [
    "AstroBirdz",
    "ABZ",
    marketing,
    team,
    psi,
    buyback,
    router
  ], {initializer: 'initialize'}) as AstroBirdsV2;
  await astroBirdsV2.deployed();
  console.log("AstroBirdsV2 deployed:", astroBirdsV2.address);

  // const dividendTracker = new ethers.Contract("0x5fb0C0EcDA9f536df1627047C1FbDB7da8a83f60", AstroBirdzDividendTrackerAbi.abi, signer) as AstroBirdzDividendTracker; // test
  // const dividendTracker = new ethers.Contract("0x53789db481ce032B530B0a20dE940C21f5A8BD01", AstroBirdzDividendTrackerAbi.abi, signer) as AstroBirdzDividendTracker; // main
  const AstroBirdzDividendTracker = await ethers.getContractFactory("AstroBirdzDividendTracker");
  const dividendTracker = await AstroBirdzDividendTracker.connect(signer).deploy(psi, astroBirdsV2.address) as AstroBirdzDividendTracker;
  await dividendTracker.deployed();
  console.log("AstroBirdzDividendTracker deployed to:", dividendTracker.address);
  await (await astroBirdsV2.initPSIDividendTracker(dividendTracker.address)).wait()

  const AstroBirdzStaking = await ethers.getContractFactory("AstroBirdzStaking");
  // let staking = new ethers.Contract("0x6bAf0fC5A1237cdb7d346Ff8115277502C4eBb54", AstroBirdzStakingAbi.abi, signer) as AstroBirdzStaking; // bsc main and test
  // staking = await upgrades.upgradeProxy(staking.address, AstroBirdzStaking) as AstroBirdzStaking
  const staking = await upgrades.deployProxy(AstroBirdzStaking, [
    astroBirdsV2.address,
    astroBirdsV2.address
  ], {initializer: 'initialize'}) as AstroBirdzStaking;
  await staking.deployed();
  await (await astroBirdsV2.excludeFromFeesAndDividends(staking.address)).wait()
  await (await astroBirdsV2.addMinter(staking.address)).wait()
  console.log("AstroBirdzStaking deployed:", staking.address);
  
  const abImplAddress = await upgrades.erc1967.getImplementationAddress(astroBirdsV2.address)
  console.log("AstroBirdsV2 implementation address:", abImplAddress);
  await run("verify:verify", { address: abImplAddress, constructorArguments: [] });
  console.log("AstroBirdsV2 implementation verified");

  await run("verify:verify", { address: dividendTracker.address, constructorArguments: [psi, astroBirdsV2.address] });
  console.log("AstroBirdzDividendTracker verified");

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
