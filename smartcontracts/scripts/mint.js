const { ethers, upgrades } = require("hardhat");

async function main() {
    let chainboytoken; 
    const ChainBoyToken = await ethers.getContractFactory("ChainBoyToken"); 
    chainboytoken = await ChainBoyToken.attach("0x..123"); // TODO: paste token address
    await chainboytoken.mint(
        "0x0..1",
        ethers.utils.parseEther("100.0"),
    );
    await chainboytoken.mint(
        "0x0..2",
        ethers.utils.parseEther("100.0"),
    );
    await chainboytoken.mint(
        "0x0..3",
        ethers.utils.parseEther("100.0"),
    );
}

main();
