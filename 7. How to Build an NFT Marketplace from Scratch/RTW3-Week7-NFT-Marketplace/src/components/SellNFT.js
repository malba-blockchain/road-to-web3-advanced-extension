import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';
import { useLocation } from "react-router";
import { upload } from "@testing-library/user-event/dist/upload";

export default function SellNFT () {

    // Import the required useState and ethers modules.
    const [formParams, updateFormParams] = useState({ name: '', description: '', price: '' }); // Initialize state to hold form input values.
    const [fileURL, setFileURL] = useState(null); // Initialize state to store the URL of the uploaded file.
    const ethers = require("ethers"); // Import the ethers library for Ethereum-related functionality.
    const [message, updateMessage] = useState(''); // Initialize state to hold a message that can be updated.
    const location = useLocation(); // Use the useLocation hook from an external library to access the current location.

    async function disableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = true
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }
    
    async function enableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = false
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }


    // This asynchronous function handles the change event when a file is selected.
    async function OnChangeFile(e) {
        // Get the selected file from the input element.
        var file = e.target.files[0];

        try {

            //upload the file to IPFS
            disableButton();
            updateMessage("Uploading image.. please dont click anything!")

            // Upload the selected file to IPFS using the uploadFileToIPFS function.
            const response = await uploadFileToIPFS(file);

            // Check if the file upload was successful based on the response.
            if (response.success === true) {
                enableButton();
                updateMessage("");
                // Log a success message and update the file URL state with the IPFS URL.
                console.log("Uploaded image to Pinata:", response.pinataURL);
                setFileURL(response.pinataURL);
            }
        } catch (e) {
            // If an error occurs during the file upload, log the error.
            console.log("Error during file upload", e);
        }
    }

    async function uploadMetadataToIPFS() {

        const {name, description, price} = formParams;

        if(!name || !description || !price || !fileURL) {
            updateMessage("Please fill all the fields!");
            return -1;
        }
            
        const nftJSON = {
            name, description, price, image: fileURL
        };

        try{
            const response = await uploadJSONToIPFS(nftJSON);

            // Check if the file upload was successful based on the response.
            if (response.success === true) {
                // Log a success message and update the file URL state with the IPFS URL.
                console.log("Uploaded JSON to Pinata:", response.pinataURL);
                return response.pinataURL;
            }
        }
        catch (e) {
            console.log("Error uploading JSON metadata:" + e);
        }
    }

    // This asynchronous function is used to list an NFT for sale.
    async function listNFT(e) {
        // Prevent the default form submission behavior.
        e.preventDefault();

        try {
            // Upload the metadata of the NFT to IPFS (InterPlanetary File System).
            const metadataURL = await uploadMetadataToIPFS();
            if(metadataURL === -1)
                return;

            // Create a Web3Provider instance using the injected Ethereum object in the browser.
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Get a signer object to send transactions.
            const signer = provider.getSigner();

            disableButton();

            // Update a message indicating the ongoing process.
            updateMessage("Uploading, please wait and don't click anything... (Up to 5 min)");

            // Create an ethers Contract instance using the Marketplace's address and ABI.
            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);

            // Parse the NFT price from the form input and convert it to ethers' representation.
            const price = ethers.utils.parseUnits(formParams.price, 'ether');
            
            // Retrieve the listing price from the smart contract.
            let listingPrice = await contract.getListPrice();
            listingPrice = listingPrice.toString();

            // Create a transaction to list the NFT on the marketplace contract.
            let transaction = await contract.createToken(metadataURL, price, { value: listingPrice });
            // Wait for the transaction to be mined.
            await transaction.wait();

            // Display an alert confirming the successful listing of the NFT.
            alert("NFT successfully listed!");
            enableButton();
            // Clear the message.
            updateMessage("");
            // Clear the form input values.
            updateFormParams({ name: '', description: '', price: '' });
            // Redirect the user to the homepage.
            window.location.replace("/");
            
        } catch(e) {
            // If an error occurs during the process, display an alert with the error message.
            alert("Upload error: " + e);
        }
    }


    return (
        <div className="">
        <Navbar></Navbar>
        <div className="flex flex-col place-items-center mt-10" id="nftForm">
            <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <h3 className="text-center font-bold text-purple-500 mb-8">Upload your NFT to the marketplace</h3>
                <div className="mb-4">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="NFT#4563" onChange={e => updateFormParams({...formParams, name: e.target.value})} value={formParams.name}></input>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                    <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" cols="40" rows="5" id="description" type="text" placeholder="NFT Collection Description" value={formParams.description} onChange={e => updateFormParams({...formParams, description: e.target.value})}></textarea>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="price">Price (in ETH)</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 0.01 ETH" step="0.01" value={formParams.price} onChange={e => updateFormParams({...formParams, price: e.target.value})}></input>
                </div>
                <div>
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="image">Upload Image (&lt;500 KB)</label>
                    <input type={"file"} onChange={OnChangeFile}></input>
                </div>
                <br></br>
                <div className="text-red-500 text-center">{message}</div>
                <button onClick={listNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg" id="list-button">
                    List NFT
                </button>
            </form>
        </div>
        </div>
    )
}