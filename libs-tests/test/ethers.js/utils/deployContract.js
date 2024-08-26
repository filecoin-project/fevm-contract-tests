const { ethers } = require('hardhat')
const { getDeployerF1Address, isFilecoinNetwork } = require('../../util/utils')

const deployContract = async (contractName, ...args) => {
  const [ethDeployer] = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(ethDeployer.address);
  const maxPriorityFeePerGas = await ethers.provider.send(
    "eth_maxPriorityFeePerGas",
    []
  );
  const options = { nonce, maxPriorityFeePerGas, gasLimit: 1000000000 };

  // create a contract factory
  const Contract = await ethers.getContractFactory(contractName);
  // send a deployment transaction, without waiting for the transaction to be mined
  return await Contract.deploy(...args, options);
}

module.exports = deployContract