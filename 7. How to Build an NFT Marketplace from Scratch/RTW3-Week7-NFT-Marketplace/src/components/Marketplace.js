import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

import { Alchemy, Network } from "alchemy-sdk";

var collectionsToShow = [];

export default function Marketplace() {
const sampleData = [
    {
        "name": "NFT#1",
        "description": "Alchemy's First NFT",
        "website":"http://axieinfinity.io",
        "image":"https://gateway.pinata.cloud/ipfs/QmTsRJX7r5gyubjkdmzFrKQhHv74p5wT9LdeF1m3RTqrE5",
        "price":"0.03ETH",
        "currentlySelling":"True",
        "address":"0xe81Bf5A757CB4f7F82a2F23b1e59bE45c33c5b13",
    },
    {
        "name": "NFT#2",
        "description": "Alchemy's Second NFT",
        "website":"http://axieinfinity.io",
        "image":"https://gateway.pinata.cloud/ipfs/QmdhoL9K8my2vi3fej97foiqGmJ389SMs55oC5EdkrxF2M",
        "price":"0.03ETH",
        "currentlySelling":"True",
        "address":"0xe81Bf5A757C4f7F82a2F23b1e59bE45c33c5b13",
    },
    {
        "name": "NFT#3",
        "description": "Alchemy's Third NFT",
        "website":"http://axieinfinity.io",
        "image":"https://gateway.pinata.cloud/ipfs/QmTsRJX7r5gyubjkdmzFrKQhHv74p5wT9LdeF1m3RTqrE5",
        "price":"0.03ETH",
        "currentlySelling":"True",
        "address":"0xe81Bf5A757C4f7F82a2F23b1e59bE45c33c5b13",
    },
];

const [formParams, updateFormParams] = useState({ newcollectionAddress: '' }); // Initialize state to hold form input values.

const [data, updateData] = useState(sampleData);

const [dataFetched, updateFetched] = useState(false);

/*
async function getAllNFTs() {
    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    //create an NFT Token
    let transaction = await contract.getAllNFTs()

    //Fetch all the details of every NFT from the contract and display
    const items = await Promise.all(transaction.map(async i => {
        var tokenURI = await contract.tokenURI(i.tokenId);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta = await axios.get(tokenURI);
        meta = meta.data;

        let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
        let item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            owner: i.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
        }
        return item;
    }))

    updateFetched(true);
    updateData(items);
}

*/

//NEW CODE UNDER THIS LINE

const secret = process.env.REACT_APP_PINATA_SECRET;

const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.ETH_SEPOLIA,
  };

const alchemy = new Alchemy(config);

async function addCollectionToMarketplace(e) {

    // Prevent the default form submission behavior.
    e.preventDefault();

    const {newcollectionAddress} = formParams;

    pushCollectionToCollectionsToShow(newcollectionAddress);

    updateFormParams({ newcollectionAddress: ''});

    getAllNFTs(); //Update the view by searching all the NFTs based on the new collection
} 

async function pushCollectionToCollectionsToShow (tempCollection) {
    collectionsToShow.push(tempCollection);

    let unique = [];
    collectionsToShow.forEach(element => {
        if (!unique.includes(element)) {
            unique.push(element);
        }
    });

    collectionsToShow = unique;
}

async function getAllNFTs() {

    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const signer = provider.getSigner();

    pushCollectionToCollectionsToShow(MarketplaceJSON.address);

    //collectionsToShow.push("0xb2Aa79F0C7f2Db32FC01e40141424B6f70F22B60"); 
    
    //collectionsToShow.push("0x47cc316568E2C089ff47ca0E44a2239d49476DA9"); 
    
    //collectionsToShow.push("0x66DD33F83fb81e0493650dfddc06801074b8bE7F"); 
    
    var allItems = [] //Array that contains all the items in all the collections to show

    console.log(collectionsToShow);

    for(var collectionIndex in collectionsToShow) {

        //Pull the deployed contract instance
        let contract = new ethers.Contract(collectionsToShow[collectionIndex], MarketplaceJSON.abi, signer)

        // Flag to omit metadata
        const omitMetadata = false;

        // Get all NFTs from Alchemy API request
        const alchemyRequest = await alchemy.nft.getNftsForContract(collectionsToShow[collectionIndex], {
            omitMetadata: omitMetadata,
        });
        //console.log(JSON.stringify(alchemyRequest, null, 2));

        var transaction = [];

        for(var i in alchemyRequest)
            transaction.push([i, alchemyRequest[i]]);

        transaction = transaction[0][1];

        //console.log(transaction);

        //Fetch all the details of every NFT from the contract and display
        var items = await Promise.all(transaction.map(async i => {
            const tokenURI = i.tokenUri.raw;
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = i.rawMetadata.price;
            let item = {
                price,
                tokenId: i.tokenId,
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            allItems.push(item);
            return item;
        }))
        
    } 

    updateFetched(true);
    updateData(allItems);
}


if(!dataFetched)
    getAllNFTs();

    

return (
    <div>
        <Navbar></Navbar>
        <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <div className="mb-4">
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="newcollectionAddress" type="text" placeholder="New collection address to add" onChange={e => updateFormParams({...formParams, newcollectionAddress: e.target.value})} value={formParams.newcollectionAddress}></input>
            </div>
            <br></br>
            
            <button onClick={addCollectionToMarketplace} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg" id="list-button">
                Add Collection to Marketplace
            </button>
        </form>


        <div className="flex flex-col place-items-center mt-20">
            <div className="md:text-xl font-bold text-white">
                Top NFTs
            </div>
            <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                })}
            </div>
        </div>            
    </div>
);

}