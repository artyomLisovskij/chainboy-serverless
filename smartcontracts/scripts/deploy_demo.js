const { ethers, upgrades } = require("hardhat");

async function main() {
    // deploy token
    const Demo = await ethers.getContractFactory(
        "IPFSTasks"
    );
    console.log("Deploying IPFSTasks...");
    const contract = await Demo.deploy()
    await contract.waitForDeployment();
    console.log("IPFSTasks deployed to:", contract.address);
}

main();
// deployed at https://explorer.test.siberium.net/address/0x9167E96D632C502a40e2Ddc830a2354Ca98eA2d2