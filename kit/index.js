const request = require('sync-request')
const { ethers } = require('ethers')

// Setup testing environment
const NODE_MANAGER_URL = 'http://localhost:8090'

function postRequest (url, data) {
  const res = request('POST', NODE_MANAGER_URL + url, { json: data })
  const body = JSON.parse(res.getBody())
  return body
}

function getRequest (url) {
  const res = request('GET', NODE_MANAGER_URL + url)
  const body = JSON.parse(res.getBody())
  return body
}

function initNode (filAmount, blockTimeMs) {
  if (!process.argv.includes('itest')) {
    return
  }
  blockTimeMs = blockTimeMs || 100 // Use 1s as default block time
  try {
    // create a clean environment for testing
    console.log('Resetting Lotus node with block time:', blockTimeMs)
    const res = postRequest('/restart', { blockTimeMs })
    if (res.ready === false) {
      throw Error('node is not ready')
    }

    const nodeUrl = getRequest('/urls').node_url

    // fund some FIL for testing
    // fund both wallets to avoid unknown-actor problems when transacting,
    // see https://github.com/filecoin-project/lotus/issues/12441
    const wallets = [process.env.DEPLOYER_PRIVATE_KEY, process.env.USER_1_PRIVATE_KEY]
    console.log('Setting up new wallets for: %s and %s', ...wallets)
    sendFil(wallets.map((key) => (new ethers.Wallet(key).address)), filAmount)

    console.log(`Finished setup, Node RPC endpoint: ${nodeUrl}`)
    return nodeUrl
  } catch (error) {
    console.error('Error initializing node:', error)
  }
}

function sendFil (accounts, amount) {
  if (!process.argv.includes('itest')) {
    return
  }
  accounts.forEach((receiver) => {
    const res = postRequest('/send', {
      receiver,
      amount
    })
    if (res.error) {
      console.error(res.error)
      process.exit(1)
    }
    console.log(`Sent ${amount} to ${receiver}`)
  })
}

module.exports = {
  initNode,
  sendFil
}
