// SPDX-License-Identifier: MIT

//SMART CONTRACT ON CHAIN: https://sepolia.etherscan.io/address/0xe78217e7bfa11c026e62f81b598203bfd643ebee
//OPENSEA COLLECTION: https://testnets.opensea.io/collection/alchemy-103

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Alchemy is ERC721, ERC721Enumerable, ERC721URIStorage, Pausable, Ownable {
    ////////////////////////////
    //SMART CONTRACT VARIABLES
    ////////////////////////////

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    uint256 MAX_SUPPLY = 10000;

    mapping(address=>uint8) public amountOfOwnedNFTs;

    ////////////////////////////
    // SMART CONTRACT CONSTRUCTOR
    ////////////////////////////
    constructor() ERC721("Alchemy", "ALCH") {}

    ////////////////////////////
    // SMART CONTRACT FUNCTIONS
    ////////////////////////////

    // Pauses the contract
    function pause() public onlyOwner {
        _pause();
    }

    // Unpauses the contract
    function unpause() public onlyOwner {
        _unpause();
    }

    // Safely mints a new token
    function safeMint(address to, string memory uri) public onlyOwner {
        
        require(_tokenIdCounter.current() <= MAX_SUPPLY, "Max supply has been reached.");
        require(amountOfOwnedNFTs[to] <= 3, "The address reached the max amount of NFTs that can own");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        amountOfOwnedNFTs[to] = amountOfOwnedNFTs[to] + 1;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    ////////////////////////////
    // THE FOLLOWING FUNCTIONS ARE OVERRIDES REQUIRED BY SOLIDITY AND GENERATED BY THE OPENZEPPELIN WIZARD. DONT ELIMINATE.
    ////////////////////////////

    // Burns the token
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Retrieves the token URI
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Checks if the contract supports the given interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
