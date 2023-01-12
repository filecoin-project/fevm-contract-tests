require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-web3')
require('@nomicfoundation/hardhat-chai-matchers')
const request = require("sync-request");
const { ethers } = require("ethers");

/** @type import('hardhat/config').HardhatUserConfig */

const defaultNodeUrl = "http://localhost:1234/rpc/v0";

// Setup testing environment
const nodeManagerUrl = "http://localhost:8090";

var nodeUrl;
if (process.argv.includes("itest")) {
  try {
    // create a clean environment for testing
    var res = JSON.parse(
      request("POST", nodeManagerUrl + "/restart").getBody()
    );
    if (res.ready === false) {
      throw Error("node is not ready");
    }
    nodeUrl =
      JSON.parse(request("GET", nodeManagerUrl + "/urls").getBody())[
        "node_url"
      ] || defaultNodeUrl;

    const address = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY);

    // fund some FIL for testing
    res = request("POST", nodeManagerUrl + "/send", {
      json: {
        receiver: address.address,
        amount: 10,
      },
    });
    console.log(JSON.parse(res.getBody()));
  } catch (err) {
    console.log(
      `cannot fetch node information from node manager ${nodeManagerUrl}`,
      err
    );
    process.exit(1);
  }
}

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
