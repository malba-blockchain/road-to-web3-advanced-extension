const chai = require("chai")
const expect = chai.expect
chai.use(require('chai-as-promised'))
const { time } = require("@openzeppelin/test-helpers");

const valA = ethers.utils.keccak256(0xBAD060A7)
const hashA = ethers.utils.keccak256(valA)
const valBwin = ethers.utils.keccak256(0x600D60A7)
const valBlose = ethers.utils.keccak256(0xBAD060A7)

console.log("This is ValA:", valA);
console.log("This is hashA:", hashA);
console.log("This is valBwin:", valBwin);
console.log("This is valBlose:", valBlose);

// Chai's expect(<operation>).to.be.revertedWith behaves
// strangely, so I'm implementing that functionality myself
// with try/catch
const interpretErr = err => {
  if (err.reason)
    return err.reason
  else
    return err.stackTrace[0].message.value.toString('ascii')
}

describe("Casino", async () => {
  
  it("1. Not allow you to propose a zero wei bet", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    try {
      tx = await c.proposeBet(hashA)
      rcpt = await tx.wait()

      // If we get here, it's a fail
      expect("this").to.equal("fail")
    } catch(err) {
      expect(interpretErr(err)).to
        .match(/you need to actually bet something/)
    }
  })   // it "Not allow you to bet zero wei"

  it("2. Not allow you to accept a bet that doesn't exist", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    try {
      tx = await c.acceptBet(hashA, valBwin, {value: 10})
      rcpt = await tx.wait()
      expect("this").to.equal("fail")
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Nobody made that bet/)
    }
  })   // it "Not allow you to accept a bet that doesn't exist" 

  it("3. Allow you to propose and accept bets", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, valBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      
  })   // it "Allow you to accept a bet"

  it("4. Not allow you to accept an already accepted bet", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, valBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      tx = await c.acceptBet(hashA, valBwin, {value: 10})
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Bet has already been accepted/)
    }          
  })   // it "Not allow you to accept an already accepted bet" 


  it("5. Not allow you to accept with the wrong amount", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    try {
      tx = await c.acceptBet(hashA, valBwin, {value: 11})
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Need to bet the same amount as sideA/)
    }          
  })   // it "Not allow you to accept with the wrong amount"   


  it("6. Not allow you to reveal with wrong value", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, valBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      tx = await c.reveal(valBwin)
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Not a bet you placed or wrong value/)
    }          
  })   // it "Not allow you to reveal with wrong value" 


  it("7. Not allow you to reveal before bet is accepted", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    try {
      tx = await c.reveal(valA)
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Bet has not been accepted yet/)
    }          
  })   // it "Not allow you to reveal before bet is accepted"  

  it("8. Work all the way through (B wins)", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, valBwin, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    // A sends the transaction, so the change due to the
    // bet will only be clearly visible in B

    preBalanceB = await ethers.provider.getBalance(signer[1].address)    
    tx = await cA.reveal(valA)
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetSettled")
    postBalanceB = await ethers.provider.getBalance(signer[1].address)        
    deltaB = postBalanceB.sub(preBalanceB)
    expect(deltaB.toNumber()).to.equal(2e10)   


  })   // it "Work all the way through (B wins)"


  it("9. Work all the way through (A wins)", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, valBlose, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    // A sends the transaction, so the change due to the
    // bet will only be clearly visible in B
    preBalanceB = await ethers.provider.getBalance(signer[1].address)    
    tx = await cA.reveal(valA)
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetSettled")
    postBalanceB = await ethers.provider.getBalance(signer[1].address)        
    deltaB = postBalanceB.sub(preBalanceB)
    expect(deltaB.toNumber()).to.equal(0) 
  })   // it "Work all the way through (A wins)"


  it("10. Will not execute forfeit because the bet has not been accepted yet", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    try {
      tx = await cB.executeForfeit(hashA)
      rcpt = await tx.wait()  
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Bet has not even been accepted yet/)
    }       
  })   // it "Will not execute forfeit because the bet has not been accepted yet"

  it("11. Will not execute forfeit because is not a bet you accepted", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])
    cC = cA.connect(signer[2])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, valBlose, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")   

    try {
      tx = await cC.executeForfeit(hashA)
      rcpt = await tx.wait()  
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Not a bet you accepted as sideB, or wrong value/)
    }       
  })   // it "Will not execute forfeit because is not a bet you accepted"


  it("12. Will not execute forfeit because the forfeit period has not elapsed yet", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, valBlose, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    try {
      tx = await cB.executeForfeit(hashA)
      rcpt = await tx.wait()  
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/The forfeit period has not elapsed yet/)
    }    
  })   // it "Will not execute forfeit because the forfeit period has not elapsed yet"


  it("13. Will execute forfeit because the forfeit period has already elapsed", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, valBlose, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    //Wait for forfeit period to pass, increasing the time in the EVM machine

    await ethers.provider.send("evm_increaseTime", [21])

    tx = await cB.executeForfeit(hashA)
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetSettled")
    
  })   // it "Will execute forfeit because the forfeit period has already elapsed"

})     // describe("Casino")