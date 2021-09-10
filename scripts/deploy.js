/* global ethers */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main (signer) {
  let signerAddress = await signer.getAddress()
  console.log('signer:', signerAddress)
  const MegaPool = await ethers.getContractFactory('MegaPool', signer)
  const dQuickAddress = '0xf28164a485b0b2c90639e47b0f377b4a438a16b1'
  const megaPool = await MegaPool.deploy(signerAddress, dQuickAddress)
  await megaPool.deployed()
  console.log('Deployed megapool contract:', megaPool.address)
  return megaPool
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  const signer = new LedgerSigner(ethers.provider)
  main(signer)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployProject = main
