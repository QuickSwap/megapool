/* global ethers */
/* eslint-disable  prefer-const */

const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main (signer) {
  if (signer === null) {
    signer = new LedgerSigner(ethers.provider)
  }

  let signerAddress = await signer.getAddress()
  const MegaPool = await ethers.getContractFactory('MegaPool')
  const dQuickAddress = '0xf28164a485b0b2c90639e47b0f377b4a438a16b1'
  const megaPool = await MegaPool.deploy(signerAddress, dQuickAddress)
  console.log('Deployed megapool contract:', megaPool.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main(null)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}
