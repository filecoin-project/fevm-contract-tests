const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

const { ethers } = require("hardhat");
const deployContract = require("./utils/deployContract");
const { getDeployerAddress } = require("./utils/getDeployerAddresses");

const WebSocket = require("ws");

const { Formatter } = require("@ethersproject/providers");

const TOKEN_NAME = "my_token";
const TOKEN_SYMBOL = "TKN";
const TOKEN_INITIAL_SUPPLY = 1000;

let deployerAddr, deploymentTxHash, erc20Address;

describe("ERC20", function () {
  it("Should successfully deploy", async function () {
    deployerAddr = await getDeployerAddress();
    const erc20 = await deployContract(
      "ERC20PresetFixedSupply",
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_INITIAL_SUPPLY,
      deployerAddr
    );

    deploymentTxHash = erc20.deployTransaction.hash;
    console.log("hash", deploymentTxHash);

    await erc20.deployed();
  });
  it("Should access deployment transaction receipt", async function () {
    const txReceipt = await ethers.provider.getTransactionReceipt(
      deploymentTxHash
    );
    erc20Address = txReceipt.contractAddress;
  });
  it("Should set the right name", async function () {
    const ERC20 = await ethers.getContractAt(
      "ERC20PresetFixedSupply",
      erc20Address
    );
    const name = await ERC20.name();

    name.should.be.equal(TOKEN_NAME);
  });
  it("Should set the right symbol", async function () {
    const ERC20 = await ethers.getContractAt(
      "ERC20PresetFixedSupply",
      erc20Address
    );
    const symbol = await ERC20.symbol();

    symbol.should.be.equal(TOKEN_SYMBOL);
  });
  it("Should set the right initial supply", async function () {
    const ERC20 = await ethers.getContractAt(
      "ERC20PresetFixedSupply",
      erc20Address
    );
    const ownerBalance = await ERC20.balanceOf(deployerAddr);

    ownerBalance.should.be.equal(TOKEN_INITIAL_SUPPLY);
  });
  it("Should be able to transfer token", async function () {
    const [deployer, receiver] = await web3.eth.getAccounts();
    const ERC20 = await ethers.getContractAt(
      "ERC20PresetFixedSupply",
      erc20Address
    );

    const wsUrl = hre.network.config.url.replace("http", "ws");
    const wsProvider = new ethers.providers.WebSocketProvider(wsUrl);

    function transferEventAssertFunc(event) {
      event.address.should.equal(erc20Address);
      event.topics[0].should.equal(
        ethers.utils.id("Transfer(address,address,uint256)")
      );
      event.topics[1].should.equal(
        ethers.utils.hexZeroPad(deployer, 32).toLowerCase()
      );
      event.topics[2].should.equal(
        ethers.utils.hexZeroPad(receiver, 32).toLowerCase()
      );
    }

    const spy0 = sinon.spy();
    wsProvider.on("block", (blockNumber) => {
      spy0();
      expect(blockNumber).to.be.a("number");
    });

    const spy1 = subscribe(
      wsProvider,
      {
        address: erc20Address,
      },
      transferEventAssertFunc
    );

    const spy2 = subscribe(
      wsProvider,
      {
        address: web3.eth.accounts.create().address,
      },
      transferEventAssertFunc
    );

    const spy3 = subscribe(
      wsProvider,
      {
        topics: null,
      },
      transferEventAssertFunc
    );

    const spy4 = subscribe(
      wsProvider,
      {
        topics: [],
      },
      transferEventAssertFunc
    );

    const spy5 = subscribe(
      wsProvider,
      {
        topics: [ethers.utils.id("Transfer(address,address,uint256)")],
      },
      transferEventAssertFunc
    );

    const spy6 = subscribe(
      wsProvider,
      {
        topics: [ethers.utils.id("NOTEXIST(address)")],
      },
      transferEventAssertFunc
    );

    const spy7 = subscribe(
      wsProvider,
      {
        address: erc20Address,
        topics: [ethers.utils.id("Transfer(address,address,uint256)")],
      },
      transferEventAssertFunc
    );

    const spy8 = subscribe(
      wsProvider,
      {
        address: erc20Address,
        topics: [ethers.utils.id("NOTEXIST(address)")],
      },
      transferEventAssertFunc
    );

    const spy9 = subscribe(
      wsProvider,
      {
        address: erc20Address,
        topics: [null, ethers.utils.hexZeroPad(deployer, 32).toLowerCase()],
      },
      transferEventAssertFunc
    );

    const maxPriorityFeePerGas = parseInt(
      await ethers.provider.send("eth_maxPriorityFeePerGas", [])
    );
    const options = { maxPriorityFeePerGas };

    const receipt = await ERC20.transfer(
      receiver,
      TOKEN_INITIAL_SUPPLY,
      options
    );
    await receipt.wait();

    spy0.should.have.been.called;
    spy1.should.have.been.calledOnce;
    spy2.should.not.have.been.called;
    spy3.should.have.been.calledOnce;
    spy4.should.have.been.calledOnce;
    spy5.should.have.been.calledOnce;
    spy6.should.not.have.been.called;
    spy7.should.have.been.calledOnce;
    spy8.should.not.have.been.called;
    spy9.should.have.been.calledOnce;
  });
});

function subscribe(provider, filter, assertFunc) {
  const spy = sinon.spy();
  provider.on(filter, (event) => {
    spy();
    assertFunc(event);
  });
  return spy;
}
