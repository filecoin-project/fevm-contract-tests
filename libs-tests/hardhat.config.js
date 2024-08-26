require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-web3')
require('@nomicfoundation/hardhat-chai-matchers')
require('hardhat-gas-reporter')

const defaultNodeUrl = 'http://localhost:1234/rpc/v0'

const nodeUrl = require('../kit').initNode(1000, 200)

module.exports = {
  solidity: {
    version: '0.8.23',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
        details: { yul: false },
      },
    },
  },
  defaultNetwork: 'local',
  networks: {
    local: {
      url: defaultNodeUrl,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
    itest: {
      url: nodeUrl + '/rpc/v1',
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.USER_1_PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: true,
    noColors: true,
  },
}
