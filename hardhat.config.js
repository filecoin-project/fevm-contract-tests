require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-web3')
require('@nomicfoundation/hardhat-chai-matchers')

const defaultNodeUrl = "http://localhost:1234/rpc/v0";

const nodeUrl = require('./kit')(1000);

module.exports = {
  solidity: "0.8.15",
  defaultNetwork: "local",
  networks: {
    local: {
      url: defaultNodeUrl,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
    itest: {
      url: nodeUrl + "/rpc/v0",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
    hyperspace: {
      url: "http://api.hyperspace.node.glif.io/rpc/v0",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
    wallaby: {
      url: "https://wallaby.node.glif.io/rpc/v0",
      httpHeaders: {
        "Content-Type": "application/json",
      },
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
    hardhat: {
      mining: {
        auto: false,
        interval: 1000,
      },
      accounts: [
        {
          privateKey: process.env.DEPLOYER_PRIVATE_KEY,
          balance: "1000000000000000000",
        },
      ],
    },
  },
};
