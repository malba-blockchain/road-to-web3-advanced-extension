//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

//Console functions to help debug the smart contract just like in Javascript
import "hardhat/console.sol";
//OpenZeppelin's NFT Standard Contracts. We will extend functions from this in our implementation
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplaceWithoutRoyalties is ERC721URIStorage {

    /////////////////SMART CONTRACT VARIABLES/////////////////
    address payable owner;

    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    Counters.Counter private _itemsSold;

    uint256 listPrice = 0.01 ether;

    mapping (uint256 => ListedToken) private idToListedToken;

    /////////////////SMART CONTRACT STRUCTS/////////////////
    struct ListedToken {
         uint256 tokenId;
         address payable tokenOwner;
         address payable seller;
         uint256 price;
         bool currentlyListed;
    }

    /////////////////SMART CONTRACT CONSTRUCTOR/////////////////
    constructor () ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    /////////////////SMART CONTRACT FUNCTIONS/////////////////
    // Function to create an NFT token and list it for sale
    function createToken(string memory _tokenURI, uint256 _price) public payable returns (uint256) {
        // Ensure the caller sends exactly the required listing price in Ether
        require(msg.value == listPrice, "Send enough ether to list your NFT");
        
        // Ensure the specified price for the NFT is greater than 0
        require(_price > 0, "Make sure the price isn't negative");

        // Increment the counter to generate a unique token ID
        _tokenIds.increment();

        // Get the current unique token ID
        uint256 currentTokenId = _tokenIds.current();

        // Mint a new NFT with the currentTokenId, assigning ownership to the caller (msg.sender)
        _safeMint(msg.sender, currentTokenId);

        // Set the metadata (URI) for the minted NFT
        _setTokenURI(currentTokenId, _tokenURI);

        // Create a listing for the newly minted NFT with the specified price
        createListedToken(currentTokenId, _price);

        // Return the unique token ID of the created NFT
        return currentTokenId;
    }


    function createListedToken(uint256 _tokenId, uint256 _price) private {
        idToListedToken[_tokenId] = ListedToken (
            _tokenId,
            payable(address(this)),
            payable(msg.sender),
            _price,
            true
        );

        _transfer(msg.sender, address(this), _tokenId);
    }

    // Function to retrieve information about all listed NFTs
    function getAllNFTs() public view returns (ListedToken[] memory) {
        // Get the total number of NFTs that have been created
        uint nftCount = _tokenIds.current();

        // Initialize an array to store information about all listed NFTs
        ListedToken[] memory tokens = new ListedToken[](nftCount);

        // Initialize the current index for the tokens array
        uint currentIndex = 0;

        // Loop through each NFT to retrieve its information
        for (uint i = 0; i < nftCount; i++) {
            // Calculate the current NFT's ID
            uint currentId = i + 1;

            // Access the ListedToken struct associated with the current NFT's ID
            ListedToken storage currentItem = idToListedToken[currentId];

            // Store the information of the current NFT in the tokens array
            tokens[currentIndex] = currentItem;

            // Move to the next index in the tokens array
            currentIndex += 1;
        }

        // Return the array containing information about all listed NFTs
        return tokens;
    }


    // Function to retrieve information about NFTs owned or listed by the caller
    function getMyNFTs() public view returns (ListedToken[] memory) {
        // Get the total number of NFTs that have been created
        uint totalItemCount = _tokenIds.current();
        
        // Initialize variables to track the number of relevant NFTs and the current index
        uint itemCount = 0;
        uint currentIndex = 0;

        // Count the number of NFTs owned or listed by the caller
        for (uint i = 0; i < totalItemCount; i++) {
            // Calculate the current NFT's ID
            uint currentId = i + 1;

            // Check if the caller is the owner or seller of the current NFT
            if (idToListedToken[currentId].tokenOwner == msg.sender || idToListedToken[currentId].seller == msg.sender) {
                // Increment the count of relevant NFTs
                itemCount++;
            }
        }

        // Initialize an array to store information about the caller's NFTs
        ListedToken[] memory items = new ListedToken[](itemCount);

        // Populate the array with information about the caller's NFTs
        for (uint i = 0; i < totalItemCount; i++) {
            // Calculate the current NFT's ID
            uint currentId = i + 1;

            // Check if the caller is the owner or seller of the current NFT
            if (idToListedToken[currentId].tokenOwner == msg.sender || idToListedToken[currentId].seller == msg.sender) {
                // Access the ListedToken struct associated with the current NFT's ID
                ListedToken storage currentItem = idToListedToken[currentId];

                // Store the information of the current NFT in the items array
                items[currentIndex] = currentItem;

                // Move to the next index in the items array
                currentIndex++;
            }
        }

        // Return the array containing information about the caller's NFTs
        return items;
    }


    // Function to execute the sale of an NFT
    function executeSale(uint256 _tokenId) public payable {
        // Get the price of the NFT being sold
        uint price = idToListedToken[_tokenId].price;

        // Ensure the caller sends the exact asking price for the NFT
        require(msg.value == price, "Send the asking price for the NFT in order to purchase");

        // Get the address of the seller of the NFT
        address seller = idToListedToken[_tokenId].seller;

        // Update the status of the NFT to indicate it's currently listed and assign the buyer as the new seller
        idToListedToken[_tokenId].currentlyListed = true;
        idToListedToken[_tokenId].seller = payable(msg.sender);

        // Increment the counter to track the number of items sold
        _itemsSold.increment();

        // Transfer the ownership of the NFT from the contract to the buyer
        _transfer(address(this), msg.sender, _tokenId);

        // Approve the contract to manage the NFT, allowing the buyer to potentially sell it in the future
        approve(address(this), _tokenId);

        // Transfer the listing fee (listPrice) to the contract's owner
        payable(owner).transfer(listPrice);

        // Transfer the payment to the seller of the NFT
        payable(seller).transfer(msg.value);
    }

    

    /////////////////SMART CONTRACT HELPER FUNCTIONS/////////////////
    function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update the listing price");

        listPrice = _listPrice;
    }

    function getListPrice () public view returns (uint256) {
        return listPrice;
    }

    function getLatestListedIdToListedToken () public view returns (ListedToken memory){
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedForTokenId(uint256 _tokenId) public view returns (ListedToken memory){
        return idToListedToken[_tokenId];
    }

    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds.current(); 
    }

}