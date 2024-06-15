const { ethers, upgrades } = require("hardhat");

async function main() {
    let chainboytoken; 
    const ChainBoyToken = await ethers.getContractFactory("ChainBoyToken"); 
    chainboytoken = await ChainBoyToken.attach("0x3cf1Ad0C68AC60a06B573111Ef82FB29FfbF67F7"); // TODO: paste token address
    await chainboytoken.mint(
        "0x0052D24E2473417761c61619248956b0A3Ac3900",
        ethers.parseEther("100.0"),
    );
    await chainboytoken.mint(
        "0x009773c4b4C5A0cF62c98618DbD1A0A103cEf301",
        ethers.parseEther("100.0"),
    );
    await chainboytoken.mint(
        "0x00120E8CAeF7ca6deD7Ee7223F8C3425eDbD7d02",
        ethers.parseEther("100.0"),
    );
}

main();
