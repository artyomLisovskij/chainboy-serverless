// const { ethers, upgrades } = require("hardhat");
var Web3 = require('web3');
var web3 = new Web3('https://rpc.test.siberium.net');

async function main() {
    const tx = await web3.eth.getTransaction('0x6f44b1def9e222f7c16a56c014c0a2175da9b00624c65aa1a9b0d8e1a1c4cff1')
    var result = await web3.eth.call(tx, tx.blockNumber)
    result = result.startsWith('0x') ? result : `0x${result}`
    if (result && result.substr(138)) {
        const reason = ethers.web3.utils.toAscii(result.substr(138))
        console.log('reason:', reason)
    } else {
        console.log('cannot get reason')
    }
}

main();

