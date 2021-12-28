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
  const astro = await hre.ethers.getContractFactory("AstroBirdsV2");
  
  //Testing on demo token
  //const greeter = await upgrades.deployProxy(astro,["DUMP","DUMP","0x3eBB59457D79c062B9D614Cd7177cA4B16EF8D11","0xdF752E3b80F65a1eadfD1507f0386A41D89F0C27","0x8a5BCE7AB4c38b0cab8A3dce349ffcC99DEdcaB4", "0x96884298978Df1F0AFc1916a4d60170b8F35c88C"],{initializer: 'initialize'});
  const greeter = await upgrades.upgradeProxy("0x7B8A69B2D286b93C8510a4C7EE461749292e042b",astro)
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

