/* global describe it before hre ethers */

const { expect } = require('chai')
const { deployProject } = require('../scripts/deploy.js')

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

describe('Deploying and testing MegaPool', async function () {
  let signer
  let megaPool
  let tx
  let receipt
  let token
  const maskNetworkAddress = '0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7'
  before(async function () {
    // signer = new LedgerSigner(ethers.provider)
    signer = (await ethers.getSigners())[0]
    megaPool = await deployProject(signer)
    const childChainManager = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [childChainManager]
    })
    const tokenSigner = await ethers.getSigner(childChainManager)
    token = await ethers.getContractAt('IDepositor', maskNetworkAddress, tokenSigner)
  })

  it('Should notify rewards', async function () {
    const args = [
      {
        rewardToken: maskNetworkAddress,
        reward: ethers.utils.parseEther('100'),
        rewardDuration: (60 * 60 * 24) * 60

      }
    ]
    tx = await megaPool.notifyRewardAmount(args)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    console.log('complete')
    // await global.ghstTokenContract.mint()
    // const balance = await global.ghstTokenContract.balanceOf(global.account)
    // const oneMillion = ethers.utils.parseEther('10000000')
    // expect(balance).to.equal(oneMillion)
  })
})
