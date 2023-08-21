// SPDX-License-Identifier: MIT 
pragma solidity 0.8.4;  //Do not change the solidity version as it negativly impacts submission grading

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakerNoRetrieval is Ownable  {

  ExampleExternalContract public exampleExternalContract;

  //MAIN SMART CONTRACT VARIABLES
  mapping(address => uint256) public balances;
  mapping(address=> uint256) public depositTimestamps;

  uint256 public constant rewardRatePerSecond = 0.1 ether;
  uint256 public withdrawalDeadline = block.timestamp + 90 seconds; //Withdrawal for staking is only available for the first 2 min
  uint256 public claimDeadline = block.timestamp + 300 seconds; //Claim deadline is only available until 4 min
  uint256 public currentBlock = 0;


  //SMART CONTRACT EVENTS
  event Stake(address indexed sender, uint256 amount);
  event Received(address sender, uint256 amount);
  event Execute (address indexed sender, uint256 amount);


  //SMART CONTRACT MODIFIERS
  modifier withdrawalDeadlineReached(bool requireReached){
    uint256 timeRemaining = withdrawalTimeLeft();

    if(requireReached) {
      require(timeRemaining ==0, "Withdrawal period is not reached yet");
    }
    else {
      require(timeRemaining >0, "Withdrawal period has been reached");
    }
    _;
  }

  modifier claimDeadlineReached(bool requireReached){
    uint256 timeRemaining = claimPeriodLeft();

    if(requireReached) {
      require(timeRemaining ==0, "Claim deadline is not reached yet");
    }
    else {
      require(timeRemaining >0, "Claim deadline has been reached");
    }
    _;
  }

  modifier notCompleted() {
    bool completed = exampleExternalContract.completed();
    require(!completed, "Stake already completed!");
    _;
  }

  //SMART CONTRACT CONSTRUCTOR
  constructor(address exampleExternalContractAddress) {
      exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
  }

  // Stake function for a user to stake ETH in our contract
  function stake() public payable withdrawalDeadlineReached(false) claimDeadlineReached(false) {
    balances[msg.sender] = balances[msg.sender] + msg.value;
    depositTimestamps[msg.sender] = block.timestamp;
    emit Stake(msg.sender, msg.value);
  }

  //Withdrawal function for a user withdrawalDeadlineReached(true) claimDeadlineReached(false)
  function withdraw() public withdrawalDeadlineReached(true) claimDeadlineReached(false) notCompleted {
        
    require(balances[msg.sender] > 0, "You have no balance to withdraw!");

    uint256 individualBalance = balances[msg.sender];

    uint256 indBalanceAndRewards = individualBalance + (((block.timestamp-depositTimestamps[msg.sender])*rewardRatePerSecond));

    uint256 exponentialBalanceToWithdraw = (indBalanceAndRewards / 10**18) **2;

    exponentialBalanceToWithdraw = exponentialBalanceToWithdraw * (10**18);
    
    balances[msg.sender] = 0;

    (bool sent,) = msg.sender.call{value: exponentialBalanceToWithdraw}("");

    require (sent, "RIP. Withdrawal failed x_x");
  }


  /*
    Allows any user to repatriate "unproductive" funds that are left in the staking contract
    past the defined withdrawal period ans send it to the external contract
  */
  function execute() public claimDeadlineReached(true) notCompleted {
    uint256 contractBalance = address(this).balance;
    exampleExternalContract.complete{value: contractBalance}();

  }


  //SMART CONTRACT FUNCTIONS
  function withdrawalTimeLeft() public view returns(uint256 withdrawal_Time_Left) {
    
    if(block.timestamp >= withdrawalDeadline){
      return (0);
    }
    else {
      return (withdrawalDeadline - block.timestamp );
    }
  }

  function claimPeriodLeft() public view returns(uint256 claim_Period_Left) {
    
    if(block.timestamp >= claimDeadline){
      return (0);
    }
    else {
      return (claimDeadline - block.timestamp );
    }
  }

  function killTime() public onlyOwner {
    currentBlock = block.timestamp;
  }

  /*
  \Function for our smart contract to receive ETH
  cc: https://docs.soliditylang.org/en/latest/contracts.html#receive-ether-function
  */
  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

}
