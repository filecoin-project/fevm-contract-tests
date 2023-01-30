# Lotus Eth JSON-RPC integration tests

This project holds a suite of integration tests for the Ethereum JSON-RPC API
built in Lotus with the Filecoin EVM runtime.

This repo is the test runner for all the project repo in the `extern/` folder.

## Running tests

### Build the local lotus

1. Go through the [Lotus installation](https://lotus.filecoin.io/lotus/install/prerequisites/) guide to install the dependencies
2. Install node dependencies by running `npm install`
3. cd `./node` and run `make node`
4. Run the node in `./bin/node`

### Prepare the .env file

1. echo -n DEPLOYER_PRIVATE_KEY=0x > .env
2. openssl rand -hex 32 >> .env
3. echo -n USER_1_PRIVATE_KEY=0x >> .env
4. openssl rand -hex 32 >> .env
5. Copy the .env file into ./extern/fevm-hardhat-kit/, ./extern/openzeppelin-contracts/, ./extern/fevm-uniswap-v3-core/

### Run each test project

1. ethers.js and web3.js (root folder)
   1. npm install
   2. npx hardhat --network itest test
2. ./extern/fevm-hardhat-kit
   1. change the `DEPLOYER_PRIVATE_KEY` in .env to `PRIVATE_KEY`
   2. yarn
   3. npx hardhat --network itest deploy
3. ./extern/openzeppelin-contracts 
   1. npm install
   2. npx hardhat --network itest test
4. ./extern/fevm-uniswap-v3-core
   1. yarn
   2. npx hardhat --network itest test

## License

Dual-licensed: [MIT](./LICENSE-MIT), [Apache Software License v2](./LICENSE-APACHE), by way of the
[Permissive License Stack](https://protocol.ai/blog/announcing-the-permissive-license-stack/).
