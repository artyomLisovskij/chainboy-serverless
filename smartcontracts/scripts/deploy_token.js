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