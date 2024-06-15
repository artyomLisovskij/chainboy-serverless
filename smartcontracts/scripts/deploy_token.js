const { ethers, upgrades } = require("hardhat");

async function main() {
    // deploy token
    const ChainBoyToken = await ethers.getContractFactory(
        "ChainBoyToken"
    );
    console.log("Deploying ChainBoyToken...");
    const contract = await upgrades.deployProxy(ChainBoyToken, [], {
        initializer: "initialize",
        kind: "transparent",
    });
    await contract.deployed();
    console.log("ChainBoyToken deployed to:", contract.address);
}

main();

// deployed: https://explorer.test.siberium.net/address/0x3cf1Ad0C68AC60a06B573111Ef82FB29FfbF67F7