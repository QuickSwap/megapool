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
  const quick = '0x831753dd7087cac61ab5644b308642cc1c33dc13'
  let quickContract
  const dquick = '0xf28164a485b0b2c90639e47b0f377b4a438a16b1'
  const childChainManager = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'
  let dragonLair
  let dQuickAmount
  // const maskNetworkAddress = '0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7'

  const tokens = {
    ghst: '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7'
    // mask: '0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7',
    // angel: '0x0B6afe834dab840335F87d99b45C2a4bd81A93c7',
    // tel: '0xdf7837de1f2fa4631d716cf2502f8b230f1dcc32',
    // ads: '0x598e49f01bEfeB1753737934a5b11fea9119C796',
    // swap: '0x3809dcDd5dDe24B37AbE64A5a339784c3323c44F',
    // plr: '0xa6b37fc85d870711c56fbcb8afe2f8db049ae774',
    // fear: '0xa2CA40DBe72028D3Ac78B5250a8CB8c404e7Fb8C',
    // mooned: '0x7E4c577ca35913af564ee2a24d882a4946Ec492B',
    // ooe: '0x9d5565dA88e596730522CbC5a918d2A89dbC16d9',
    // usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    // xed: '0x2fe8733dcb25BFbbA79292294347415417510067',
    // mona: '0x6968105460f67c3BF751bE7C15f92F5286Fd0CE5',
    // revv: '0x70c006878a5A50Ed185ac4C87d837633923De296',
    // trade: '0x692AC1e363ae34b6B489148152b12e2785a3d8d6',
    // dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    // wbtc: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    // usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    // link: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
    // uni: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'

  }

  before(async function () {
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [childChainManager]
    })
    await hre.network.provider.send('hardhat_setBalance', [
      childChainManager,
      '0x9000000000000000000000000000000'
    ])
    const tokenSigner = await ethers.getSigner(childChainManager)

    // console.log('Deploying ERC20 contracts')
    // const ERC20Factory = await ethers.getContractFactory('ERC20Factory', tokenSigner)
    // const erc20Factory = await ERC20Factory.deploy()
    // await erc20Factory.deployed()
    // for (let i = 0; i < 9; i++) {
    //   console.log('Deploying 20...')
    //   tx = await erc20Factory.deployERC20(20, { gasLimit: 20000000 })
    //   receipt = await tx.wait()
    //   if (!receipt.status) {
    //     throw Error(`Transaction failed: ${tx.hash}`)
    //   }
    //   const erc20Addresses = await erc20Factory.getContracts()
    //   for (const address of erc20Addresses) {
    //     tokens[`ghst${address}`] = address
    //   }
    // }

    megaPool = await deployProject(tokenSigner)

    dragonLair = await ethers.getContractAt('IDragonLair', dquick, tokenSigner)

    for (const [name, address] of Object.entries(tokens)) {
      console.log('Minting tokens for user:', name)
      token = await ethers.getContractAt('IDepositor', address, tokenSigner)
      tokens[name] = token
      const bytes = ethers.utils.defaultAbiCoder.encode(['uint'], [ethers.utils.parseEther('100')])
      tx = await token.deposit(megaPool.address, bytes)
      receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Transaction failed: ${tx.hash}`)
      }
    }

    console.log('Minted 100 tokens for each token')

    console.log('Mint QUICK for user')
    token = await ethers.getContractAt('IDepositor', quick, tokenSigner)
    const bytes = ethers.utils.defaultAbiCoder.encode(['uint'], [ethers.utils.parseEther('100')])
    tx = await token.deposit(childChainManager, bytes)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    } else {
      console.log('Quick minted')
    }

    console.log('Approve Quick in Dragon Lair')

    quickContract = await ethers.getContractAt('IERC20', quick, tokenSigner)
    tx = await quickContract.approve(dquick, ethers.utils.parseEther('100'))
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    } else {
      console.log('Quick approved for transfer by Dragon Lair')
    }

    console.log('Get dQuick')
    tx = await dragonLair.enter(ethers.utils.parseEther('100'))
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    } else {
      console.log('Got dQuick')
    }

    console.log('Allow MegaPool to transfer dQuick')
    tx = await dragonLair.approve(megaPool.address, ethers.utils.parseEther('100'))
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    } else {
      console.log('Allowed')
    }
    await hre.network.provider.send('evm_increaseTime', [60 * 60])
  })

  it('Should notify rewards', async function () {
    const args2 = [
      {
        rewardToken: '0x300211def2a644b036a9bdd3e58159bb2074d388', // token address
        reward: ethers.utils.parseEther('1000'), // total amount of rewards
        rewardDuration: (60 * 60 * 24) * 60 // distributed over 60 days
      },
      {
        rewardToken: '0x598e49f01befeb1753737934a5b11fea9119c796', // token address
        reward: ethers.utils.parseEther('9000'), // total amount of rewards
        rewardDuration: (60 * 60 * 24) * 60 // distributed over 300 days
      }
    ]

    const args = Object.values(tokens).map(v => {
      return {
        rewardToken: v.address,
        reward: ethers.utils.parseEther('100'),
        rewardDuration: (60 * 60 * 24) * 60
      }
    })
    console.log('Num ERC20 contracts:', args.length)
    tx = await megaPool.notifyRewardAmount(args)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    await hre.network.provider.send('evm_increaseTime', [60 * 5])
    await ethers.provider.send('evm_mine')
    // console.log('complete')
    // await global.ghstTokenContract.mint()
    // const balance = await global.ghstTokenContract.balanceOf(global.account)
    // const oneMillion = ethers.utils.parseEther('10000000')
    // expect(balance).to.equal(oneMillion)
  })

  it('Stake dQuick in MegaPool', async function () {
    dQuickAmount = await dragonLair.balanceOf(childChainManager)
    console.log('Staking', ethers.utils.formatEther(dQuickAmount), 'dQuick')
    // console.log(ethers.utils.formatEther(dQuickAmount))
    tx = await megaPool.stake(dQuickAmount)
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }

    // let earned = await megaPool['earned(address)'](childChainManager)
    // console.log(earned[0])

    await hre.network.provider.send('evm_increaseTime', [60 * 60 * 24])
    await ethers.provider.send('evm_mine')

    const earned = await megaPool['earned(address)'](childChainManager)
    console.log(ethers.utils.formatEther(earned[0].earned))

    // await hre.network.provider.send('evm_increaseTime', [60 * 60 * 24])
    // await ethers.provider.send('evm_mine')

    // await global.ghstTokenContract.mint()
    // const balance = await global.ghstTokenContract.balanceOf(global.account)
    // const oneMillion = ethers.utils.parseEther('10000000')
    // expect(balance).to.equal(oneMillion)
  })

  it('Exit dQuick Stake in MegaPool', async function () {
    let currentDquick = await dragonLair.balanceOf(childChainManager)
    expect(currentDquick).to.equal(0)

    // let earned = await megaPool['earned(address)'](childChainManager)
    // console.log(earned[0])

    tx = await megaPool.exit()
    // tx = await megaPool.withdrawAll()
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Transaction failed: ${tx.hash}`)
    }
    currentDquick = await dragonLair.balanceOf(childChainManager)
    expect(currentDquick).to.equal(dQuickAmount)

    // await hre.network.provider.send('evm_increaseTime', [60 * 60 * 24])

    let earned = await megaPool['earned(address)'](childChainManager)
    console.log(ethers.utils.formatEther(earned[0].earned))

    await ethers.provider.send('evm_mine')

    earned = await megaPool['earned(address)'](childChainManager)
    console.log(ethers.utils.formatEther(earned[0].earned))

    // await global.ghstTokenContract.mint()
    // const balance = await global.ghstTokenContract.balanceOf(global.account)
    // const oneMillion = ethers.utils.parseEther('10000000')
    // expect(balance).to.equal(oneMillion)
  })
})
