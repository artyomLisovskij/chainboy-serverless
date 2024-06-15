const { ethers, upgrades } = require("hardhat");

async function main() {
    // deploy chainboy
    const ChainBoy = await ethers.getContractFactory("ChainBoy");
    chainboy = await upgrades.deployProxy(ChainBoy, [
        "0x3cf1Ad0C68AC60a06B573111Ef82FB29FfbF67F7" // token address
    ]);
    await chainboy.waitForDeployment();
    console.log("chainboy deployed to:", await chainboy.getAddress());
}

main();
// deployed: https://explorer.test.siberium.net/address/0xdFCB907a04806cf473d2Eb1662dfC52bb0Ac445B