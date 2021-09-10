/* global ethers */
/* eslint-disable  prefer-const */
const { LedgerSigner } = require('@ethersproject/hardware-wallets')

async function main (signer, megaPool, rewards) {
  if (megaPool === undefined) {
    // pass
  }
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
