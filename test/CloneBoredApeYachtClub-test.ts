import { ethers } from "hardhat";
import { expect } from "chai";
import { beforeEach, it } from "mocha";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Bored Ape", () => {
    let cloneBoredApeYachtClubContract: Contract;
    let owner: SignerWithAddress;
    let buyer: SignerWithAddress;
    const MAX_APE_PURCHASE = 20;
    const MAX_APES = 21;

    beforeEach(async () => {
        // We can refer to the contract by the contract name in 
        // `artifacts/contracts/CloneBoredApeYachtClub.sol/CloneBoredApeYachtClub.json`
        // initialize the contract factory: https://docs.ethers.io/v5/api/contract/contract-factory/
        const CloneBoredApeYachtClub = await ethers.getContractFactory("CloneBoredApeYachtClub");

        // create an instance of the contract, giving us access to all
        // functions & variables
        cloneBoredApeYachtClubContract = await CloneBoredApeYachtClub.deploy(
            "Bored Ape Yacht Club",
            "BAYC",
            MAX_APES,
            1
        );

        [owner, buyer] = await ethers.getSigners();
    })

    it("Should initialize Bored Ape contract", async () => {
        // use the "expect" assertion, and read the MAX_APES variable
        expect(await cloneBoredApeYachtClubContract.MAX_APES()).to.equal(MAX_APES);
    })

    it("Should set the right owner", async () => {
        expect(await cloneBoredApeYachtClubContract.owner()).to.equal(await owner.address);
    })

    it("Should fail to mint an ape til sale is active", async () => {
        await expect(cloneBoredApeYachtClubContract.mintApe(1))
            .to.be.revertedWith('Sale must be active to mint Ape');
    })

    it(`Should fail to mint an ape over ${MAX_APE_PURCHASE} at a time`, async () => {
        await cloneBoredApeYachtClubContract.flipSaleState();
        await expect(cloneBoredApeYachtClubContract.mintApe(MAX_APE_PURCHASE + 1))
            .to.be.revertedWith('Can only mint 20 tokens at a time');
    })

    it("Should mint an ape", async () => {
        await cloneBoredApeYachtClubContract.flipSaleState();
        expect(await cloneBoredApeYachtClubContract.saleIsActive()).to.be.equal(true);

        const apePrice = await cloneBoredApeYachtClubContract.apePrice();
        const tokenId = await cloneBoredApeYachtClubContract.totalSupply();

        await expect(cloneBoredApeYachtClubContract.mintApe(1, { value: apePrice }))
            .to.emit(cloneBoredApeYachtClubContract, "Transfer")
            .withArgs(ethers.constants.AddressZero, owner.address, tokenId);
    })

    it(`Should fail to mint an ape over max supply ${MAX_APES}`, async () => {
        await cloneBoredApeYachtClubContract.flipSaleState();
        await expect(cloneBoredApeYachtClubContract.mintApe(MAX_APE_PURCHASE + 1))
            .to.be.revertedWith('Can only mint 20 tokens at a time');
    })

    it(`Should fail to mint an ape unsufficient price`, async () => {
        await cloneBoredApeYachtClubContract.flipSaleState();
        await expect(cloneBoredApeYachtClubContract.mintApe(1, { value: ethers.utils.parseUnits("0.07", "ether") }))
            .to.be.revertedWith('Ether value sent is not correct');
    })
})