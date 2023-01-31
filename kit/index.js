const request = require("sync-request");
const { ethers } = require("ethers");

// Setup testing environment
const nodeManagerUrl = "http://localhost:8090";

function initNode(filAmount, blockTimeMs) {
  if (!process.argv.includes("itest")) {
    return;
  }
  blockTimeMs = blockTimeMs || 100; // Use 1s as default block time
  try {
    // create a clean environment for testing
    var res = JSON.parse(
      request("POST", nodeManagerUrl + "/restart", {
        json: {
          blockTimeMs: blockTimeMs,
        },
      }).getBody()
    );
    if (res.ready === false) {
      throw Error("node is not ready");
    }
    const nodeUrl = JSON.parse(
      request("GET", nodeManagerUrl + "/urls").getBody()
    )["node_url"];

    const address = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY);

    // fund some FIL for testing
    res = request("POST", nodeManagerUrl + "/send", {
      json: {
        receiver: address.address,
        amount: filAmount,
      },
    });
    return nodeUrl;
  } catch (err) {
    console.log(
      `cannot fetch node information from node manager ${nodeManagerUrl}`,
      err
    );
    process.exit(1);
  }
}

function sendFil(accounts, amount) {
  if (!process.argv.includes("itest")) {
    return;
  }
  accounts.forEach((acc) => {
    res = request("POST", nodeManagerUrl + "/send", {
      json: {
        receiver: acc,
        amount: amount,
      },
    });
    console.log(JSON.parse(res.getBody()));
  });
}

module.exports = {
  initNode,
  sendFil,
};
