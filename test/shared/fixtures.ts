import { Wallet, Contract, providers, utils, constants } from 'ethers'
import { waffle, ethers, upgrades } from 'hardhat'

import { expandTo18Decimals } from './utilities'

import { AstroBirdsV2, AstroBirdzDividendTracker, AstroBirdzStaking, WBNB, FakePSI, PancakeFactory, PancakeRouter, IPancakePair }  from '../../typechain';

import AstroBirdsV2Abi from '../../artifacts/contracts/AstroBirdsV2.sol/AstroBirdsV2.json'
import AstroBirdzDividendTrackerAbi from '../../artifacts/contracts/AstroBirdzDividendTracker.sol/AstroBirdzDividendTracker.json'
import AstroBirdzStakingAbi from '../../artifacts/contracts/AstroBirdzStaking.sol/AstroBirdzStaking.json'
import WBNBAbi from '../../artifacts/contracts/test/WBNB.sol/WBNB.json'
import FakePSIAbi from '../../artifacts/contracts/test/FakePSI.sol/FakePSI.json'
import PancakeFactoryAbi from '../../artifacts/contracts/test/PancakeFactory.sol/PancakeFactory.json'
import PancakeRouterAbi from '../../artifacts/contracts/test/PancakeRouter.sol/PancakeRouter.json'
import IPancakePairAbi from '../../artifacts/contracts/test/PancakeRouter.sol/IPancakePair.json'

const overrides = {
  gasLimit: 9500000
}

interface V2Fixture {
  WBNB: WBNB 
  PSI: FakePSI
  factory: PancakeFactory
  router: PancakeRouter
  astroBirdz: AstroBirdsV2
  dividendTracker: AstroBirdzDividendTracker
  pair: IPancakePair
  staking: AstroBirdzStaking
}

export async function v2Fixture([wallet, marketing, team, buyback]: Wallet[], provider: providers.Web3Provider): Promise<V2Fixture> {
  // base tokens
  const WBNB = await waffle.deployContract(wallet, WBNBAbi, [], overrides) as unknown as WBNB
  const PSI = await waffle.deployContract(wallet, FakePSIAbi, [], overrides) as unknown as FakePSI

  // pancake router
  const factory = await waffle.deployContract(wallet, PancakeFactoryAbi, [wallet.address], overrides) as unknown as PancakeFactory
  const router = await waffle.deployContract(wallet, PancakeRouterAbi, [factory.address, WBNB.address], overrides) as unknown as PancakeRouter

  await (await PSI.approve(router.address, constants.MaxUint256)).wait();
  await router.addLiquidityETH(PSI.address, expandTo18Decimals(40000), 0, 0, wallet.address, constants.MaxUint256, { value: expandTo18Decimals(20) })

  // astroBirdz
  const AstroBirdsV2 = await ethers.getContractFactory("AstroBirdsV2");
  const astroBirdz = await upgrades.deployProxy(AstroBirdsV2, [
    "AstroBirdz",
    "ABZ",
    marketing.address,
    team.address,
    PSI.address,
    buyback.address,
    router.address
  ], {initializer: 'initialize'}) as AstroBirdsV2;
  const dividendTracker = await waffle.deployContract(wallet, AstroBirdzDividendTrackerAbi, [PSI.address, astroBirdz.address], overrides) as unknown as AstroBirdzDividendTracker
  await (await astroBirdz.initPSIDividendTracker(dividendTracker.address)).wait()

  // pair
  const pairAddress = await factory.getPair(astroBirdz.address, WBNB.address)
  const pair = new Contract(pairAddress, IPancakePairAbi.abi, provider) as IPancakePair;

  // staking
  const AstroBirdzStaking = await ethers.getContractFactory("AstroBirdzStaking");
  const staking = await upgrades.deployProxy(AstroBirdzStaking, [
    astroBirdz.address,
    astroBirdz.address
  ], {initializer: 'initialize'}) as AstroBirdzStaking;
  await (await astroBirdz.excludeFromFeesAndDividends(staking.address)).wait()

  return {
    WBNB,
    PSI,
    factory,
    router,
    astroBirdz,
    dividendTracker,
    pair,
    staking
  }
}
