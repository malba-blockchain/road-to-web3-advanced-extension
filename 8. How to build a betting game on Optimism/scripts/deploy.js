
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);
  
  // make sure to replace the "Casino" reference with your own smart contract name!
  const Casino = await ethers.getContractFactory("Casino");
  const casino = await Casino.deploy();

  console.log("Casino address:", casino.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});