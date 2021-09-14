/* global describe it before hre ethers */

const { expect } = require('chai')
const { deployProject } = require('../scripts/deploy.js')

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

describe('Deploying and testing MegaPool', async function () {
  this.timeout(300000)
  let signer
  let megaPool
  let tx
  let receipt
  let token
  // const maskNetworkAddress = '0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7'

  const tokens = {
    mask: '0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7',
    angel: '0x0B6afe834dab840335F87d99b45C2a4bd81A93c7',
    tel: '0xdf7837de1f2fa4631d716cf2502f8b230f1dcc32',
    ads: '0x598e49f01bEfeB1753737934a5b11fea9119C796',
    swap: '0x3809dcDd5dDe24B37AbE64A5a339784c3323c44F',
    plr: '0xa6b37fc85d870711c56fbcb8afe2f8db049ae774',
    fear: '0xa2CA40DBe72028D3Ac78B5250a8CB8c404e7Fb8C',
    mooned: '0x7E4c577ca35913af564ee2a24d882a4946Ec492B',
    ooe: '0x9d5565dA88e596730522CbC5a918d2A89dbC16d9',
    usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    xed: '0x2fe8733dcb25BFbbA79292294347415417510067',
    mona: '0x6968105460f67c3BF751bE7C15f92F5286Fd0CE5',
    revv: '0x70c006878a5A50Ed185ac4C87d837633923De296',
    trade: '0x692AC1e363ae34b6B489148152b12e2785a3d8d6',
    ghst: '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7',
    dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    wbtc: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    link: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
    uni: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'

  }

  before(async function () {
    // signer = new LedgerSigner(ethers.provider)
    signer = (await ethers.getSigners())[0]
    megaPool = await deployProject(signer)
    const childChainManager = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [childChainManager]
    })
    await hre.network.provider.send('hardhat_setBalance', [
      childChainManager,
      '0x9000000000000000000000000000'
    ])

    const tokenSigner = await ethers.getSigner(childChainManager)

    for (const [name, address] of Object.entries(tokens)) {
      console.log('Getting contract:', name)
      token = await ethers.getContractAt('IDepositor', address, tokenSigner)
      tokens[name] = token
      const bytes = ethers.utils.defaultAbiCoder.encode(['uint'], [ethers.utils.parseEther('100')])
      tx = await token.deposit(megaPool.address, bytes)
      receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Transaction failed: ${tx.hash}`)
      }
    }
    // console.log(tokens)

    console.log('Minted 100 tokens')
  })

  it('Should notify rewards', async function () {
    const args = Object.values(tokens).map(v => {
      return {
        rewardToken: v.address,
        reward: ethers.utils.parseEther('100'),
        rewardDuration: (60 * 60 * 24) * 60
      }
    })
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
