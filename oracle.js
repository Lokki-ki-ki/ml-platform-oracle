require('dotenv').config();
const axios = require('axios');
const { ethers } = require("ethers");
const contractABI = require('./MlPlatformABI.json'); // The ABI for the contract

// Environment variables
const { CONTRACT_ADDRESS, WEB3_PROVIDER_URL, ORACLE_PRIVATE_KEY } = process.env;
console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
console.log(`Web3 Provider URL: ${WEB3_PROVIDER_URL}`);
console.log(`Oracle Private Key: ${ORACLE_PRIVATE_KEY}`);

const provider = new ethers.providers.JsonRpcProvider(WEB3_PROVIDER_URL);
const signer = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
const backendURL = "https://kkiwonderland.tech/api/evaluator";

// Create a Data Structure to store the requests info for different requestId
// TODO: Can be improved by using a database
const requests = {};

async function listenForComputationRequest() {
    console.log("Listening for Computation Requests...");
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);

    // event StartEvent(uint256 requestId);
    contract.on("StartEvent", async (requestId) => {
        console.log(`Received start event for request ${requestId}`);
        requests[requestId] = { "clientsToSubmissions" : {}, "clientsToReputation" : {}};
    });

    // event ComputationRequestTest(uint256 _requestId, string _modelAddress, string _testDataAddress, string _testLabelAddress);
    contract.on("ComputationRequestTest", async (requestId, modelAddress, testDataAddress, testLabelAddress) => {
        console.log(`Received request ${requestId} for model ${modelAddress} with test data ${testDataAddress} and test label ${testLabelAddress}`);
        requests[requestId]["modelAddress"] = modelAddress;
        requests[requestId]["testDataAddress"] = testDataAddress;
        requests[requestId]["testLabelAddress"] = testLabelAddress;
    });

    // event ComputationRequestSingle(uint256 _requestId, uint256 _clientId, string _weightsAddress, uint256 _currentReputation);
    contract.on("ComputationRequestSingle", async (requestId, clientId, weightsAddress, currentReputation) => {
        console.log(`Received request ${requestId} for client ${clientId} with weights ${weightsAddress} and current reputation ${currentReputation}`);
        requests[requestId]["clientsToSubmissions"][clientId] = weightsAddress;
        requests[requestId]["clientsToReputation"][clientId] = currentReputation;
    });


    contract.on("EndEvent", async (requestId, modelAddress, testDataAddress) => {
        console.log(`Received end event request for ${requestId}`);
        const requestBody = requests[requestId];
        console.log(`Request Body: ${JSON.stringify(requestBody)}`);
        // const response = axios.post(backendURL, requestBody)
        //     .then(response => {
        //         console.log(`Received response: ${response.data}`);
        //         return response.data;
        //     })
        //     .catch(error => {
        //         console.error(`Error: ${error}`);
        //         return error;
        //     });

        // Provide data back to the contract
        // ********** Dummy data start **********
        const newModelAddress = "0x1234567890123456789012345678901234567890";
        const clientIds = [1, 2, 3];
        const clientNewReputations = [100, 100, 100];
        const clientRewards = [800, 100, 100]; // 0.8, 0.1, 0.1
        // **************************************
        const tx = await contract.provideData(requestId, newModelAddress, clientIds, clientNewReputations, clientRewards);
        await tx.wait();
        console.log(`Provided data for request ${requestId}: ${newModelAddress}`);
    });


}

listenForComputationRequest();

