require("@nomicfoundation/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-contract-sizer");
require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");

require('dotenv').config({path:__dirname+'/.env'})
const { RPC_URL, PRIVATE_KEY } = process.env


module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  defaultNetwork: "siberium",
  networks: {
    hardhat: {},
    siberium: {
      url: RPC_URL,
      accounts: [ PRIVATE_KEY] 
    },
    ultron: {
      url: "https://ultron-dev.io",
      accounts: [ PRIVATE_KEY] 
    }
  },
};
