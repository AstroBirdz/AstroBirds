# AstroBirdz contracts

This project is using [Hardhat](https://hardhat.org/getting-started/) for development, compiling, testing and deploying. The development tool used for development is [Visual Studio Code](https://code.visualstudio.com/) which has [great plugins](https://hardhat.org/guides/vscode-tests.html) for solidity development and mocha testing.

## Contracts

* Binance Chain
  * AstroBirdz : [0x9624cd2e91504692e120802e80a313f84847dc40](https://bscscan.com/address/0x9624cd2e91504692e120802e80a313f84847dc40)
  * AstroBirdzDividendTracker : [0x53789db481ce032B530B0a20dE940C21f5A8BD01](https://bscscan.com/address/0x53789db481ce032B530B0a20dE940C21f5A8BD01)

* Binance Test Chain
  * AstroBirdz : [0x9624cd2e91504692e120802e80a313f84847dc40](https://testnet.bscscan.com/address/0x9624cd2e91504692e120802e80a313f84847dc40)
  * AstroBirdzDividendTracker : [0xe520E54598757CF2e35B9e02210b75309e3b8091](https://testnet.bscscan.com/address/0xe520E54598757CF2e35B9e02210b75309e3b8091)

### Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

### Scripts

Use the scripts in the "scripts" folder. Each script has the command to start it on top.

Make sure you have set the right settings in your ['.env' file](https://www.npmjs.com/package/dotenv). You have to create this file with the following contents yourself:

```node
BSC_PRIVATE_KEY=<private_key>
BSC_TEST_PRIVATE_KEY=<private_key>

BSC_API_TOKEN=<bscscan_api_token>
```