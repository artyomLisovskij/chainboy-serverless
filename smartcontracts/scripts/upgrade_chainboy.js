const { ethers, upgrades } = require("hardhat");

async function main() {
    // upgrade chainboy
    const ChainBoy = await ethers.getContractFactory("ChainBoy");
    chainboy = await upgrades.upgradeProxy("0xdFCB907a04806cf473d2Eb1662dfC52bb0Ac445B", ChainBoy);

}

main();
