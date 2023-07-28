export const NFTCard = ({ nft }) => {

    return (
        <div className="w-1/4 flex flex-col ">
        <div className="rounded-md">
            <img className="object-cover h-128 w-full rounded-t-lg" src={nft.media[0].gateway} ></img>
        </div>
        <div className="flex flex-col y-gap-2 px-2 py-3 bg-slate-100 rounded-b-md h-110 ">
            <div className="">
                <h2 className="text-xl text-gray-800">{nft.title}</h2>
                <p className="text-gray-600">NFT Id: {nft.id.tokenId.substr(nft.id.tokenId.length -4)}</p>
                <p className="text-gray-600" >Contract Address: {`${nft.contract.address.substr(0,4)}...${nft.contract.address.substr(nft.contract.address.length -4)}`}</p>
                <p></p>
            </div>

            <div className="flex-grow mt-3">
                <p className="text-gray-600">NFT Description: {nft.description?.substr(0,150)}</p>
            </div>

            <div className="flex justify-center rounded-b-md mb-1 mt-3">
                <a target={"_blank"} href = {`https://etherscan.io/nft/${nft.contract.address}/${parseInt(nft.id.tokenId)}`} className="py-2 px-4 bg-blue-500 w-1/2 text-center rounded-md text-white cursor-pointer" >View NFT on Etherscan</a>
                <p>.</p>
                <a target={"_blank"} href = {`https://opensea.io/assets/ethereum/${nft.contract.address}/${parseInt(nft.id.tokenId)}`} className="py-2 px-4 bg-blue-500 w-1/2 text-center rounded-md text-white cursor-pointer" >View NFT on Opensea</a>
            </div>
        </div>

    </div>
    )
}