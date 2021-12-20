require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "BSC_test",
  networks: {
    hardhat: {
    },
    // ethereum:{
    //   url: "https://mainnet.infura.io/v3/2c327e3276c54e609c310695044b534a",
    //   accounts:[""]
    // },
    // rinkeby: {
    //   url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    //   accounts: [""],
    //   gasPrice: 20000000000
    // },
    BSC_test: {
      url: "https://data-seed-prebsc-1-s2.binance.org:8545",
      chainId:97,
      accounts: ["7a6be8d62196b7bb41328dd0189d2ce36337a7b8f11452340d9cdb10e6493262"],
      // gas: 4993756,
      // gasPrice: 50000000000
    },
    // BSC: {
    //   url: "https://bsc-dataseed.binance.org/",
    //   chainId: 56,
    //   accounts: [""]
    // }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    //apiKey: "FX1NYIQCGGTUI8K53YCBQFS1N6X6DXCFAP"
    apiKey: "N5T3AVC376B3VGU5Z7JUI658MS2Y7A9P9W"
  },
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
