# Lotus Eth JSON-RPC integration tests

This project holds a suite of integration tests for the Ethereum JSON-RPC API
built in Lotus with the Filecoin EVM runtime.

It takes advantage of the [hardhat](https://hardhat.org) framework.

## Running

By default, the test suite will run locally, expecting a local Lotus network
and the Ethereum JSON RPC to be accessible on http://localhost:1234/rpc/v0 .

A private key should be set in an `.env` file.

Once properly initialized, you may take full advantage of the power of hardhat
with the few following commands.

Compile smart contracts:

```shell
npx hardhat compile
```

Deploy them:

```shell
npx hardhat deploy
```

And run the test suites:

```shell
npx hardhat test
```

## Contributing

This project follows the default structure of a `hardhat` / `hardhat-deploy` project,
basically made of:
contracts/
deploy/
test/
hardhat.config.js
These are the default paths for a Hardhat project.

    hardhat.config.js the hardhat configuration file.
    contracts/ where the sources of smart contracts should be.
    deploy/ where deployment scripts should go.
    test/ where test scripts should go.

## License

Dual-licensed: [MIT](./LICENSE-MIT), [Apache Software License v2](./LICENSE-APACHE), by way of the
[Permissive License Stack](https://protocol.ai/blog/announcing-the-permissive-license-stack/).
