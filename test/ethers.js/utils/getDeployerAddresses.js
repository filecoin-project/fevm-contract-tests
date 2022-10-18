const { ethers } = require('hardhat')
const { actorIdToF0Address } = require('../../util/utils')

const getDeployerF0Address = async (f1Addr) => {
  try {
    // check that an actor has been deployed at the deployer address
    let actorId = await ethers.provider.send('Filecoin.StateLookupID',
      [f1Addr, []])
    // format the deployer f0 address
    return actorIdToF0Address(actorId)
  } catch (e) {
    console.error(
      `failed to resolve address ${f1Addr}. be sure to deploy an actor by sending FIL there`)
  }
}

module.exports = {
  getDeployerF0Address,
}