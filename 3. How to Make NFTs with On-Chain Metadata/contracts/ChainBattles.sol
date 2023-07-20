// SPDX-License-Identifier: MIT
// SMART CONTRACT ADDRESS: https://mumbai.polygonscan.com/address/0xedb00cd2a6694b8d009e9cd470d9afb53a8fa55a#code
// OPEN SEA ADDRESS: https://testnets.opensea.io/collection/chain-battles-225

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";


contract ChainBattles is ERC721URIStorage{
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    //Mapping to store the ID => level of each item in the collection
    //mapping(uint256 => uint256) public tokenIdToLevels;

    //Mapping to store the ID => stats of each item in the collection
    mapping(uint256 => Stats) public tokenIdToStats;

    struct Stats {
        uint level;
        uint speed;
        uint strength;
        uint life;
    }

    constructor() ERC721 ("Chain Battles", "CBTLS") {
        
    }


    function generateCharacter(uint256 tokenId) public view returns (string memory) {

        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            '<style>.base { fill: white; font-family: serif; font-size: 14px; }</style>',
            '<rect width="100%" height="100%" fill="black" />',
            '<text x="50%" y="30%" class="base" dominant-baseline="middle" text-anchor="middle">',"Warrior",'</text>',
            '<text x="50%" y="40%" class="base" dominant-baseline="middle" text-anchor="middle">', "Levels: ",getLevels(tokenId),'</text>',
            '<text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">', "Speed: ",getSpeed(tokenId),'</text>',
            '<text x="50%" y="60%" class="base" dominant-baseline="middle" text-anchor="middle">', "Strength: ",getStregth(tokenId),'</text>',
            '<text x="50%" y="70%" class="base" dominant-baseline="middle" text-anchor="middle">', "Life: ",getLife(tokenId),'</text>',
            '</svg>'
        );
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(svg)
            )    
        );
    }

    function getLevels(uint256 tokenId) public view returns (string memory) {
        uint256 levels = tokenIdToStats[tokenId].level;

        return levels.toString();
    }

    function getSpeed(uint256 tokenId) public view returns (string memory) {
        uint256 speed = tokenIdToStats[tokenId].speed;

        return speed.toString();
    }

    function getStregth(uint256 tokenId) public view returns (string memory) {
        uint256 strength = tokenIdToStats[tokenId].strength;

        return strength.toString();
    }

    function getLife(uint256 tokenId) public view returns (string memory) {
        uint256 life = tokenIdToStats[tokenId].life;

        return life.toString();
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory){
    bytes memory dataURI = abi.encodePacked(
        '{',
            '"name": "Chain Battles #', tokenId.toString(), '",',
            '"description": "Battles on chain",',
            '"image": "', generateCharacter(tokenId), '"',
        '}'
    );
    return string(
        abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(dataURI)
        )
    );
}

function mint() public {
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();

    _safeMint(msg.sender, newItemId);

    tokenIdToStats[newItemId].level = createRandom(10);

    tokenIdToStats[newItemId].speed = createRandom(9);

    tokenIdToStats[newItemId].strength = createRandom(8);

    tokenIdToStats[newItemId].life = createRandom(7);

    _setTokenURI(newItemId, getTokenURI(newItemId));
}

function train(uint256 tokenId) public {
    require(_exists(tokenId), "Please use an existing token");
    require(ownerOf(tokenId) == msg.sender, "You must own this token to train it");
    
    uint256 currentLevel = tokenIdToStats[tokenId].level;
    tokenIdToStats[tokenId].level = currentLevel + 1;
    
    _setTokenURI(tokenId, getTokenURI(tokenId));
}

function createRandom(uint number) public view returns(uint){
    return uint(blockhash(block.number-1)) % number;
}

}