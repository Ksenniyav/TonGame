const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const assert = require("assert");
const { upgrades, ethers } = require("hardhat")
const web3 = require("web3")

describe("Game", function (){
    let acc1;
	let acc2;
	let acc3;
	let game;
    let amountToPlay = ethers.utils.parseEther('1');

	beforeEach(async function() {
		[acc1, acc2, acc3] = await ethers.getSigners();
		const Game = await ethers.getContractFactory("Game");
		game = await upgrades.deployProxy(Game, [amountToPlay, acc1.address], { initializer: "initialize" });
        await game.deployed()
	})

    it("Should check initial variables", async () => {
        //amount to create game
        const _amountToPlay = await game.amountToPlay()
        const signerAccess = await game.signerAccess()
        assert.equal(_amountToPlay.toString(), amountToPlay.toString(), "Amount to play is OK")
        assert.equal(signerAccess.toString(), acc1.address.toString(), "Signer address is OK")
    })

    it("Should positive createBattle(),joinBattle(),finishBattle()", async () => {
        const battleName = "new"
        await game.createBattle(battleName, {value: amountToPlay})
        const actualName = (await game.battles(0)).name
        assert.equal(actualName, battleName, "Battle created")
        await game.connect(acc2).joinBattle(0, {value: amountToPlay})
        const actualPlayer2 = (await game.battles(0)).player2
        assert.equal(actualPlayer2.toString(), acc2.address, "Player 2 Joined")
        const ID = 0
        const player1Amount = ethers.utils.parseEther('0.9');
        const player2Amount = ethers.utils.parseEther('1.1');
        //player 1 sign
        const message1 = [ID, player1Amount, player2Amount, acc1.address]
        const hashMessage1 = ethers.utils.solidityKeccak256(["uint256","uint256","uint256","uint160"], message1)
        const sign1 = await acc1.signMessage(ethers.utils.arrayify(hashMessage1));
        const r1 = sign1.substr(0, 66)
        const s1 = '0x' + sign1.substr(66, 64);
        const v1 = web3.utils.toDecimal("0x" + (sign1.substr(130,2) == 0 ? "1b" : "1c"));
        const data1 = ethers.utils.defaultAbiCoder.encode(
            [
                'uint256',
                'uint256',
                'uint256',
                'bytes32',
                'uint8',
                'bytes32'
            ], 
            [
                ID, 
                player1Amount, 
                player2Amount,
                r1,
                v1,
                s1
            ]
        )
        const tx1 = await game.finishBattle(data1)
        // //player 1 sign
        const message2 = [ID, player1Amount, player2Amount, acc2.address]
        const hashMessage2 = ethers.utils.solidityKeccak256(["uint256","uint256","uint256","uint160"], message2)
        const sign2 = await acc1.signMessage(ethers.utils.arrayify(hashMessage2));
        const r2 = sign2.substr(0, 66)
        const s2 = '0x' + sign2.substr(66, 64);
        const v2 = web3.utils.toDecimal("0x" + sign2.substr(130,2));
        const data2 = ethers.utils.defaultAbiCoder.encode(
            [
                'uint256',
                'uint256',
                'uint256',
                'bytes32',
                'uint8',
                'bytes32'
            ], 
            [
                ID, 
                player1Amount, 
                player2Amount,
                r2,
                v2,
                s2
            ]
        )
        const tx2 = await game.connect(acc2).finishBattle(data2)
        await expect(() => tx1).to.changeEtherBalance(acc1, player1Amount)
        await expect(() => tx2).to.changeEtherBalance(acc2, player2Amount)
    })

    it("Should negative finishBattle()", async () => {
        const battleName = "new"
        await game.createBattle(battleName, {value: amountToPlay})
        const actualName = (await game.battles(0)).name
        assert.equal(actualName, battleName, "Battle created")
        await game.connect(acc2).joinBattle(0, {value: amountToPlay})
        const actualPlayer2 = (await game.battles(0)).player2
        assert.equal(actualPlayer2.toString(), acc2.address, "Player 2")
        const ID = 0
        const player1Amount = ethers.utils.parseEther('0.9');
        const player2Amount = ethers.utils.parseEther('1.1');
        const player1WrongAmount = ethers.utils.parseEther('2');
        const player2WrongAmount = ethers.utils.parseEther('2');
        //PLAYER 1 SIGN
        const message1 = [ID, player1Amount, player2Amount, acc1.address]
        const hashMessage1 = ethers.utils.solidityKeccak256(["uint256","uint256","uint256","uint160"], message1)
        const sign1 = await acc1.signMessage(ethers.utils.arrayify(hashMessage1));
        const r1 = sign1.substr(0, 66)
        const s1 = '0x' + sign1.substr(66, 64);
        const v1 = web3.utils.toDecimal("0x" + (sign1.substr(130,2) == 0 ? "1b" : "1c"));
        const data1 = ethers.utils.defaultAbiCoder.encode(
            [
                'uint256',
                'uint256',
                'uint256',
                'bytes32',
                'uint8',
                'bytes32'
            ], 
            [
                ID, 
                player1WrongAmount, 
                player2Amount,
                r1,
                v1,
                s1
            ]
        )
        await expect(
            game.finishBattle(data1)
          ).to.be.revertedWith("You dont have access")
        // PLAYER 2 SIGN
        const message2 = [ID, player1Amount, player2Amount, acc2.address]
        const hashMessage2 = ethers.utils.solidityKeccak256(["uint256","uint256","uint256","uint160"], message2)
        const sign2 = await acc1.signMessage(ethers.utils.arrayify(hashMessage2));
        const r2 = sign2.substr(0, 66)
        const s2 = '0x' + sign2.substr(66, 64);
        const v2 = web3.utils.toDecimal("0x" + sign2.substr(130,2));
        const data2 = ethers.utils.defaultAbiCoder.encode(
            [
                'uint256',
                'uint256',
                'uint256',
                'bytes32',
                'uint8',
                'bytes32'
            ], 
            [
                ID, 
                player1Amount, 
                player2WrongAmount,
                r2,
                v2,
                s2
            ]
        )
        await expect(
            game.connect(acc2).finishBattle(data2)
          ).to.be.revertedWith("You dont have access")
    })

})