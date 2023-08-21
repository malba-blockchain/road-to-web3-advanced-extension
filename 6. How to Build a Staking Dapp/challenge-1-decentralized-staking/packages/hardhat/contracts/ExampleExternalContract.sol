// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;  //Do not change the solidity version as it negativly impacts submission grading

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Staker.sol";


contract ExampleExternalContract is Ownable  {

  bool public completed;

  address public stakerAddress;

  function complete() public payable {
    completed = true;
    stakerAddress = msg.sender;
  }

  /*
    Allows the Owner to put back in the Staker "unproductive" funds that are left in the External contract
  */
  function retrieveLockedUpStake() public {
    require(msg.sender == stakerAddress, "The retrieving function can only be executed by the Staker");

    uint256 contractBalance = address(this).balance;

    (bool sent,) = stakerAddress.call{value: contractBalance}("");
    require(sent, "Error in retrieving the locked up stake");
  }

}