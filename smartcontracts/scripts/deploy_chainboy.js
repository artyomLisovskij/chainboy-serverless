const { ethers, upgrades } = require("hardhat");

async function main() {
    // deploy chainboy
    const ChainBoy = await ethers.getContractFactory("ChainBoy");
    chainboy = await upgrades.deployProxy(ChainBoy, [
        "0x..123" // TODO: token address
    ]);
    await chainboy.waitForDeployment();
    console.log("chainboy deployed to:", await chainboy.getAddress());
}

main();
