const { ethers, upgrades } = require("hardhat");

async function main() {
    // upgrade token
    const ChainBoyTokenV2 = await ethers.getContractFactory(
        "ChainBoyTokenV2"
    );
    console.log("Upgrading ChainBoyToken...");
    await upgrades.upgradeProxy(
        "0x_contract_address",
        ChainBoyTokenV2
    );
    console.log("Upgraded.");
}

main();