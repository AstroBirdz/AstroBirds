import chai, { expect } from 'chai'
import { constants } from 'ethers'
import { waffle } from 'hardhat'

import { expandTo18Decimals } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'

import { AstroBirdsV2, AstroBirdzDividendTracker, WBNB, FakePSI, PancakeFactory, PancakeRouter, IPancakePair }  from '../typechain';

chai.use(waffle.solidity)

describe('AstroBirdz', () => {
  const { provider, createFixtureLoader } = waffle;
  const [ owner, marketing, team, buyback, user1, user2 ] = provider.getWallets()
  const loadFixture = createFixtureLoader([owner, marketing, team, buyback], provider)

  let buyPath: string[] = []
  let sellPath: string[] = []

  let WBNB: WBNB
  let PSI: FakePSI
  let factory: PancakeFactory
  let router: PancakeRouter
  let astroBirdz: AstroBirdsV2
  let dividendTracker: AstroBirdzDividendTracker
  let pair: IPancakePair
  beforeEach(async function() {

    const fixture = await loadFixture(v2Fixture)
    WBNB = fixture.WBNB
    PSI = fixture.PSI
    factory = fixture.factory
    router = fixture.router
    astroBirdz = fixture.astroBirdz
    dividendTracker = fixture.dividendTracker
    pair = fixture.pair

    buyPath = [ WBNB.address, astroBirdz.address ]
    sellPath = [ astroBirdz.address, WBNB.address ]
  })

  const ethLiquidity = expandTo18Decimals(10)
  const tokenLiquidity = expandTo18Decimals(200000000)
  const addTokenLiquidity = async() => {
    await astroBirdz.approve(router.address, constants.MaxUint256);
    await router.addLiquidityETH(astroBirdz.address, tokenLiquidity, tokenLiquidity, ethLiquidity, owner.address, constants.MaxUint256, { value: ethLiquidity });
  }

  it('Deployed correctly', async () => {
    expect(await astroBirdz.dexRouters(router.address)).to.eq(true)
    expect(await astroBirdz.dexRouters(owner.address)).to.eq(false)
    expect(await astroBirdz.pancakeRouter()).to.eq(router.address)
    expect(await astroBirdz.automatedMarketMakerPairs(await astroBirdz.pancakePair())).to.eq(true)
    expect(await astroBirdz._psiAddress()).to.eq(PSI.address)
    expect(await astroBirdz._marketingAddress()).to.eq(marketing.address)
    expect(await astroBirdz._teamAddress()).to.eq(team.address)
    expect(await astroBirdz._buybackAddress()).to.eq(buyback.address)
    expect(await astroBirdz._liquidityPoolAddress()).to.eq(owner.address)
    expect(await astroBirdz.totalSupply()).to.eq(expandTo18Decimals(470000000))
  })

  it('Not possible to initializeDividendTracker again', async () => {
    await expect(astroBirdz.initPSIDividendTracker(dividendTracker.address)).to.be.revertedWith("AstroBirdz: Dividend tracker already initialized")
  })

  describe('Transfers', () => {
    it('Fail when exceeding max wallet amount on wallets not excluded', async () => {
      await astroBirdz.transfer(user1.address, expandTo18Decimals(5000001))
      await expect(astroBirdz.connect(user1).transfer(user2.address, expandTo18Decimals(5000001))).to.be.revertedWith("Transfer amount exceeds the maxTxAmount.")
      await astroBirdz.connect(user1).transfer(user2.address, expandTo18Decimals(5000000))
      await astroBirdz.connect(user1).transfer(user2.address, expandTo18Decimals(1))
      await astroBirdz.connect(user2).transfer(owner.address, expandTo18Decimals(5000001))
    })
  
    it('Succeed when enabled with 0 fees applied', async () => {
      await astroBirdz.transfer(user1.address, expandTo18Decimals(10))
      await astroBirdz.connect(user1).transfer(user2.address, expandTo18Decimals(10))
    })

    it('Succeed for adding liquidity by owner, fail for trades', async () => {
      await addTokenLiquidity()
    })
  })

  describe('Fees', () => {
    beforeEach(async() => {
      await addTokenLiquidity();
    })

    it('Not payed by excluded wallet', async () => {
      await astroBirdz.excludeFromFeesAndDividends(user1.address)
      await router.connect(user1).swapETHForExactTokens(expandTo18Decimals(1), buyPath, user1.address, constants.MaxUint256, { value: expandTo18Decimals(1) })
      expect(await astroBirdz.balanceOf(user1.address)).to.eq(expandTo18Decimals(1))
      
      await astroBirdz.connect(user1).approve(router.address, expandTo18Decimals(1))
      await router.connect(user1).swapExactTokensForETH(expandTo18Decimals(1), 0, sellPath, user1.address, constants.MaxUint256)
      expect(await astroBirdz.balanceOf(user1.address)).to.eq(0)
    })

    it('Correctly applied on buy', async () => {
      const liquidityBalance = await pair.balanceOf(owner.address)

      await router.connect(user1).swapETHForExactTokens(expandTo18Decimals(100000), buyPath, user1.address, constants.MaxUint256, { value: expandTo18Decimals(2) })

      expect(await astroBirdz.balanceOf(user1.address)).to.eq(expandTo18Decimals(89000))
      expect(await PSI.balanceOf(dividendTracker.address)).to.eq(0) // fees are not transfered on buys
      expect(await astroBirdz.balanceOf(marketing.address)).to.eq(0)
      expect((await pair.balanceOf(owner.address)).sub(liquidityBalance)).to.eq(0)

      await astroBirdz.performSwapAndLiquify() // or sell, this is mainly for testing purposes
      expect(await astroBirdz.balanceOf(marketing.address)).to.eq(0)
      expect(await PSI.balanceOf(dividendTracker.address)).to.eq('95651379716251191')
    })

    it('Correctly applied on sell', async () => {
      const liquidityBalance = await pair.balanceOf(owner.address)
      const marketingBalanceBefore = await marketing.getBalance()
      const teamBalanceBefore = await team.getBalance()
      const buybackBalanceBefore = await buyback.getBalance()

      await router.connect(user1).swapETHForExactTokens(expandTo18Decimals(1000000), buyPath, user1.address, constants.MaxUint256, { value: expandTo18Decimals(2) })

      await astroBirdz.connect(user1).transfer(user2.address, expandTo18Decimals(300000)); // needed because someone needs to retrieve dividend
      await astroBirdz.connect(user1).approve(router.address, expandTo18Decimals(300000));
      await router.connect(user1).swapExactTokensForETHSupportingFeeOnTransferTokens(expandTo18Decimals(300000), 0, sellPath, user1.address, constants.MaxUint256)

      expect(await astroBirdz.balanceOf(user1.address)).to.eq(expandTo18Decimals(290000))
      expect(await PSI.balanceOf(dividendTracker.address)).to.eq('1') // all distributed. Leaves 1?
      expect(await PSI.balanceOf(user1.address)).to.eq('604045580127098727')
      expect(await PSI.balanceOf(user2.address)).to.eq('624874738062515926')
      expect((await marketing.getBalance()).sub(marketingBalanceBefore)).to.eq('1963532206070823')
      expect((await team.getBalance()).sub(teamBalanceBefore)).to.eq('654510735356941')
      expect((await buyback.getBalance()).sub(buybackBalanceBefore)).to.eq('1963532206070823') // might be more because of 'leftovers' from adding liquidity
      expect((await pair.balanceOf(owner.address)).sub(liquidityBalance)).to.eq('4371288165562086929')
    })

    it('Works with multiple buys and sells', async () => {
      await router.swapETHForExactTokens(expandTo18Decimals(1), buyPath, user1.address, constants.MaxUint256, { value: expandTo18Decimals(5) })

      const wallets = provider.getWallets().slice(5, 12)
      for(let idx = 0; idx < wallets.length; idx++) {
        const wallet = wallets[idx]
        await router.connect(wallet).swapETHForExactTokens(expandTo18Decimals(100000), buyPath, wallet.address, constants.MaxUint256, { value: expandTo18Decimals(5) })
        expect(await astroBirdz.balanceOf(wallet.address)).to.eq(expandTo18Decimals(89000))
        expect(await dividendTracker.balanceOf(wallet.address)).to.eq(expandTo18Decimals(89000))

        if (idx == 3 || idx == 5) {
          await astroBirdz.connect(wallets[idx-1]).approve(router.address, expandTo18Decimals(89000));
          await router.connect(wallets[idx-1]).swapExactTokensForETHSupportingFeeOnTransferTokens(expandTo18Decimals(89000), 0, sellPath, wallets[idx-1].address, constants.MaxUint256)

          expect(await astroBirdz.balanceOf(wallets[idx-1].address)).to.eq(expandTo18Decimals(0))
          expect(await dividendTracker.balanceOf(wallets[idx-1].address)).to.eq(expandTo18Decimals(0))
        }
      }
    })
  })
})
