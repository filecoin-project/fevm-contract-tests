const chai = require('chai');
const expect = chai.expect;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

const deployContract = require('./utils/deployContract')
const { getDeployerAddress } = require('./utils/getDeployerAddresses')
const hre = require("hardhat");

const TOKEN_NAME = 'my_token'
const TOKEN_SYMBOL = 'TKN'
const TOKEN_INITIAL_SUPPLY = 1000

let deployerAddr, erc20

describe('ERC20', function () {
  it('Should successfully deploy', async function () {
    deployerAddr = await getDeployerAddress()
    const { contract } = await deployContract('ERC20PresetFixedSupply',
      TOKEN_NAME, TOKEN_SYMBOL, TOKEN_INITIAL_SUPPLY, deployerAddr)

    erc20 = await contract
  })
  it('Should set the right name', async function () {
    const name = await erc20.methods.name().call()

    name.should.be.equal(TOKEN_NAME)
  })
  it('Should set the right symbol', async function () {
    const symbol = await erc20.methods.symbol().call()

    symbol.should.be.equal(TOKEN_SYMBOL)
  })
  it('Should set the right initial supply', async function () {
    const ownerBalance = Number(await erc20.methods.balanceOf(deployerAddr).call())

    ownerBalance.should.be.equal(TOKEN_INITIAL_SUPPLY)
  })
  it('Should be able to transfer token', async function () {
    const [deployer, receiver] = await web3.eth.getAccounts();

    const wsUrl = hre.network.config.url.replace("http", "ws");
    const wsWeb3 = new Web3(new Web3.providers.WebsocketProvider(wsUrl));

    function transferEventAssertFunc(event) {
      event.address.should.equal(erc20.options.address);
      event.topics[0].should.equal(ethers.utils.id("Transfer(address,address,uint256)"));
      event.topics[1].should.equal(ethers.utils.hexZeroPad(deployer, 32).toLowerCase());
      event.topics[2].should.equal(ethers.utils.hexZeroPad(receiver, 32).toLowerCase());
    }

    const spy1 = subscribe(wsWeb3, {
      address: erc20.options.address,
    }, transferEventAssertFunc);

    const spy2 = subscribe(wsWeb3, {
      address: web3.eth.accounts.create().address,
    }, transferEventAssertFunc);

    const spy3 = subscribe(wsWeb3, {
      topics: null,
    }, transferEventAssertFunc);

    const spy4 = subscribe(wsWeb3, {
      topics: [],
    }, transferEventAssertFunc);

    const spy5 = subscribe(wsWeb3, {
      topics: [ethers.utils.id("Transfer(address,address,uint256)")],
    }, transferEventAssertFunc);

    const spy6 = subscribe(wsWeb3, {
      topics: [ethers.utils.id("NOTEXIST(address)")],
    }, transferEventAssertFunc);

    const spy7 = subscribe(wsWeb3, {
      address: erc20.options.address,
      topics: [ethers.utils.id("Transfer(address,address,uint256)")],
    }, transferEventAssertFunc);

    const spy8 = subscribe(wsWeb3, {
      address: erc20.options.address,
      topics: [ethers.utils.id("NOTEXIST(address)")],
    }, transferEventAssertFunc);

    const spy9 = subscribe(wsWeb3, {
      address: erc20.options.address,
      topics: [null, ethers.utils.hexZeroPad(deployer, 32).toLowerCase()],
    }, transferEventAssertFunc);

    await erc20.methods.transfer(receiver, TOKEN_INITIAL_SUPPLY/10).send({from: deployer});

    // not implemented in lotus yet
    // const spy = subscribe(wsWeb3, {
    //   address: web3.eth.accounts.create().address,
    //   fromBlock: 0,
    // }, transferEventAssertFunc);

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


function subscribe(wsWeb3, filter, assertFunc) {
  const spy = sinon.spy()
  const subscription = wsWeb3.eth.subscribe('logs', filter);
  subscription.on('data', (event) => {
    spy();
    assertFunc(event);
  });
  return spy;
}
