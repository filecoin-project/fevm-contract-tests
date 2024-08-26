# Lotus Eth JSON-RPC integration tests

This project holds a suite of integration tests for the Ethereum JSON-RPC API built in [Lotus](https://github.com/filecoin-project/lotus) with the Filecoin EVM runtime.

This repo runs some basic tests direclty against ethers.js and web3.js libraries, and also runs deployment and tests in the [fevm-hardhat-kit](https://github.com/filecoin-project/fevm-hardhat-kit) (deploy only), [openzeppelin-contracts](https://github.com/filecoin-project/openzeppelin-contracts) and [fevm-uniswap-v3-core](https://github.com/DigitalMOB2/fevm-uniswap-v3-core) repositories, each of which use hardhat to deploy and test smart contracts on the Filecoin EVM.

A custom version of Lotus is built to run these tests, which is included in the [`node`](./node) directory. Each build pulls the current `master` branch of Lotus, so the tests are always run against the latest version of Lotus.

See [`Makefile`](./Makefile) for more details on how the tests are set up and executed.

## Running tests

### Build the local lotus-runner

1. Ensure all dependencies are installed as described for a [Lotus installation](https://lotus.filecoin.io/lotus/install/prerequisites/)
2. Run `make build-lotus-runner`

### Install the dependencies

Run `make install`

This will install dependencies for each of:
1. The kit to interact with the lotus-runner (`make install-kit`)
2. The local ethers.js and web3.js library tests (`make install-libs`)
3. fevm-hardhat-kit (`make install-fevm-hardhat`)
4. openzeppelin-contracts (`make install-openzeppelin`)
5. fevm-uniswap-v3-core (`make install-uniswap-v3-core`)

### Run each test project

1. Run the local lotus-runner: `make start-lotus-runner`
2. *(In another terminal)* Run `make test`

This will execute the suite of tests across each of:
1. The local ethers.js and web3.js library tests (`make test-libs`)
2. fevm-hardhat-kit (`make test-fevm-hardhat`)
3. openzeppelin-contracts (`make test-openzeppelin`)
4. fevm-uniswap-v3-core (`make test-uniswap-v3-core`)

### Known issues

1. Wrong kind of exception received: FVM's backtrace message format is different from Ethereum's, so this repo bypasses checking the revert reason by removing the following code from `node_modules/@openzeppelin/test-helpers/src/expectRevert.js`:

   ```expect(actualError).to.equal(expectedError, 'Wrong kind of exception received');```

2. fevm-uniswap-v3-core uses jest-snapshot to generate and store snapshots of gas costs of common operations. These may change with network upgrades so may need to be re-generated and updated in the parent repository.

3. By default, ethers.js uses a block-time (`pollingInterval`) of 4s. This can be configured, but use of ethers.js mediated through Hardhat prevents overriding of this value; this means that even if we set a much shorter block-time in our local Lotus node, the ethers.js tests will still wait at least 4s before checking the results of transactions. This is fixed here in the `Makefile` `fix-hardhat` target by editing the Hardhat ethers.js wrapper to hard-write in a shorter `pollingInterval` value.

## License

Dual-licensed: [MIT](./LICENSE-MIT), [Apache Software License v2](./LICENSE-APACHE), by way of the [Permissive License Stack](https://protocol.ai/blog/announcing-the-permissive-license-stack/).
