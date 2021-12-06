// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const astro = await hre.ethers.getContractFactory("AstroBirdsV1");
  
  //Testing on demo token
  const greeter = await upgrades.deployProxy(astro,["AstroBirds","$AST","0xC36B7547481263C2aff08Aa529B9214105A63023","0xEb62bed241DA987f09EAF14F0924a6F2A9Dae639","0x461d9313757B2B1070334F80Dd4f76FE4B0582FD"],{initializer: 'initialize'});
  await greeter.deployed();

  console.log("Contract deployed to:", greeter.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

