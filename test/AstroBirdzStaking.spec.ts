import chai, { expect } from 'chai'
import { constants } from 'ethers'
import { network, waffle } from 'hardhat'

import { expandTo18Decimals, mineBlock } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'

import { AstroBirdsV2, AstroBirdzStaking }  from '../typechain';

chai.use(waffle.solidity)

describe('AstroBirdzStaking', () => {
  const { provider, createFixtureLoader } = waffle;
  const [ owner, marketing, team, buyback, user1, user2 ] = provider.getWallets()
  const loadFixture = createFixtureLoader([owner, marketing, team, buyback], provider)

  const configuredLocks = [
    { time: 30 * 86400, apy: 500 }, // 30 days
    { time: 91 * 86400, apy: 800 }, // 91 days
    { time: 182.5 * 86400, apy: 1200 }, // 182.5 days
    { time: 365 * 86400, apy: 1800 }, // 365 days
    { time: 730 * 86400, apy: 2500 }, // 730 days
  ]
  const yearMS = 365 * 24 * 60 * 60

  let astroBirdz: AstroBirdsV2
  let staking: AstroBirdzStaking
  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    astroBirdz = fixture.astroBirdz
    staking = fixture.staking

    astroBirdz.transfer(user1.address, expandTo18Decimals(10000000))
    astroBirdz.transfer(user2.address, expandTo18Decimals(10000000))
  })

  it('Deployed correctly', async () => {
    expect(await staking.rewardsToken()).to.eq(astroBirdz.address)
    expect(await staking.stakingToken()).to.eq(astroBirdz.address)
  })

  describe('Staking', () => {
    const stakeAmount = expandTo18Decimals(5000000)
    const bigStakeAmount = expandTo18Decimals(10000000)

    let startTime: number;
    beforeEach(async function() {
      startTime = (await staking.startTime()).toNumber()
    })

    it('Fails when not started', async () => {
      await expect(staking.connect(user1).stake(stakeAmount, 0)).to.be.revertedWith("Staking not started")
    })

    it('Fails when not lock not exists', async () => {
      await mineBlock(startTime)
      await expect(staking.connect(user1).stake(stakeAmount, configuredLocks.length)).to.be.revertedWith("Lock does not exist")
    })

    it('Succeeds for stake 0', async () => {
      const lock = configuredLocks[0]
      const totalRewards = stakeAmount.mul(lock.apy).mul(lock.time).div(yearMS).div(10000)
      let currentBalance = (await astroBirdz.balanceOf(user1.address)).sub(stakeAmount)

      await astroBirdz.connect(user1).approve(staking.address, stakeAmount)
      await network.provider.send("evm_setNextBlockTimestamp", [startTime])
      await staking.connect(user1).stake(stakeAmount, 0)
      expect(await astroBirdz.balanceOf(staking.address)).to.eq(stakeAmount)

      await mineBlock(startTime + (lock.time / 4))
      expect(await staking.earned(user1.address, 0)).to.eq(totalRewards.div(4))

      await network.provider.send("evm_setNextBlockTimestamp", [startTime + (lock.time / 2)])
      await staking.connect(user1).getReward(0)
      currentBalance = currentBalance.add(totalRewards.div(2))
      expect(await astroBirdz.balanceOf(user1.address)).to.eq(currentBalance)

      await network.provider.send("evm_setNextBlockTimestamp", [startTime + lock.time - 1])
      await expect(staking.connect(user1).withdraw(stakeAmount, 0)).to.be.revertedWith("Stake not unlocked")

      await network.provider.send("evm_setNextBlockTimestamp", [startTime + lock.time])
      currentBalance = currentBalance.add(stakeAmount.div(2))
      await (await staking.connect(user1).withdraw(stakeAmount.div(2), 0)).wait()
      expect(await astroBirdz.balanceOf(user1.address)).to.eq(currentBalance)

      await network.provider.send("evm_setNextBlockTimestamp", [startTime + lock.time + (48 * 60 * 60)])
      currentBalance = currentBalance.add(stakeAmount.div(2)).add(totalRewards.div(2))
      await (await staking.connect(user1).exit(0)).wait()
      expect(await astroBirdz.balanceOf(user1.address)).to.eq(currentBalance)
    })
  })
})
