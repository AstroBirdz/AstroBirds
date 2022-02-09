# AstroBirdz contracts

This project is using [Hardhat](https://hardhat.org/getting-started/) for development, compiling, testing and deploying. The development tool used for development is [Visual Studio Code](https://code.visualstudio.com/) which has [great plugins](https://hardhat.org/guides/vscode-tests.html) for solidity development and mocha testing.

## New contracts

* Binance Chain
  * AstroBirdz : [0x7f3E9bdB55a0fA72BD6025C0ee1dfC3276cE3CF9](https://bscscan.com/address/0x7f3E9bdB55a0fA72BD6025C0ee1dfC3276cE3CF9)
  * AstroBirdzDividendTracker : [0xf1222021341e456441d5857D1068E5DE941ad5B5](https://bscscan.com/address/0xf1222021341e456441d5857D1068E5DE941ad5B5)
  * Staking : [0x26acfbF060d2Ca49F50d7793b22633fd8DFa28E5](https://bscscan.com/address/0x26acfbF060d2Ca49F50d7793b22633fd8DFa28E5)

* Binance Test Chain
  * AstroBirdz : [0x26acfbF060d2Ca49F50d7793b22633fd8DFa28E5](https://testnet.bscscan.com/address/0x26acfbF060d2Ca49F50d7793b22633fd8DFa28E5)
  * AstroBirdzDividendTracker : [0x5fb0C0EcDA9f536df1627047C1FbDB7da8a83f60](https://testnet.bscscan.com/address/0x5fb0C0EcDA9f536df1627047C1FbDB7da8a83f60)
  * Staking : [0x6bAf0fC5A1237cdb7d346Ff8115277502C4eBb54](https://testnet.bscscan.com/address/0x6bAf0fC5A1237cdb7d346Ff8115277502C4eBb54)

## Old contracts

* Binance Chain
  * AstroBirdz : [0x9624cd2e91504692e120802e80a313f84847dc40](https://bscscan.com/address/0x9624cd2e91504692e120802e80a313f84847dc40)
  * AstroBirdzDividendTracker : [0x53789db481ce032B530B0a20dE940C21f5A8BD01](https://bscscan.com/address/0x53789db481ce032B530B0a20dE940C21f5A8BD01)

* Binance Test Chain
  * AstroBirdz : [0x9624cd2e91504692e120802e80a313f84847dc40](https://testnet.bscscan.com/address/0x9624cd2e91504692e120802e80a313f84847dc40)
  * AstroBirdzDividendTracker : [0xe520E54598757CF2e35B9e02210b75309e3b8091](https://testnet.bscscan.com/address/0xe520E54598757CF2e35B9e02210b75309e3b8091)
  * Staking : [0x49ae07126cd7fdc1e4be57bdc9eee6065ecee5e6](https://testnet.bscscan.com/address/0x49ae07126cd7fdc1e4be57bdc9eee6065ecee5e6)

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