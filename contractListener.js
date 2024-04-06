const { ethers } = require("ethers");

class ContractListener {
    constructor(contractAddress, contractABI, provider, backendURL, ORACLE_PRIVATE_KEY) {
        this.signer = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
        this.provider = provider;
        this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
        this.backendURL = backendURL;
        this.requests = {};
    }

    async listenForEvents() {
        console.log(`Listening for events on contract: ${this.contract.address}`);

        // Get the current block number
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`Current block number: ${blockNumber}`);
    
        // event StartEvent(uint256 requestId);
        this.contract.on("StartEvent", async (requestId, rewardPool) => {
            console.log(`Received start event for request ${requestId}`);
            this.requests[requestId] = { "clientsToSubmissions" : {}, "clientsToReputation" : {}};
            this.requests[requestId]["rewardPool"] = rewardPool.toString();
        });
    
        // event ComputationRequestTest(uint256 _requestId, string _modelAddress, string _testDataAddress, string _testLabelAddress, string _testDataHash, string _testLabelHash);
        this.contract.on("ComputationRequestTest", async (requestId, modelAddress, testDataAddress, testLabelAddress, testDataHash, testLabelHash) => {
            console.log(`Received request ${requestId} for model ${modelAddress} with test data ${testDataAddress} and test label ${testLabelAddress}`);
            this.requests[requestId]["modelAddress"] = modelAddress;
            this.requests[requestId]["testDataAddress"] = testDataAddress;
            this.requests[requestId]["testLabelAddress"] = testLabelAddress;
            this.requests[requestId]["testDataHash"] = testDataHash;
            this.requests[requestId]["testLabelHash"] = testLabelHash;
        });
    
        // event ComputationRequestSingle(uint256 _requestId, uint256 _clientId, string _weightsAddress, uint256 _currentReputation);
        this.contract.on("ComputationRequestSingle", async (requestId, clientId, weightsAddress, currentReputation) => {
            console.log(`Received request ${requestId} for client ${clientId} with weights ${weightsAddress} and current reputation ${currentReputation}`);
            this.requests[requestId]["clientsToSubmissions"][clientId] = weightsAddress;
            this.requests[requestId]["clientsToReputation"][clientId] = currentReputation.toString();
        });
    
    
        this.contract.on("EndEvent", async (requestId, modelAddress, testDataAddress) => {
            console.log(`Received end event request for ${requestId}`);
            const requestBody = this.requests[requestId];
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
            // {"newModelAddress": "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe", "clientIds": ["1", "2", "3", "4", "5"], "clientNewReputations": [100, 100, 100, 90, 80], "clientRewards": [100, 100, 100, 90, 80]}
            const newModelAddress = "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe";
            const clientIds = [1, 2, 3, 4, 5];
            const clientNewReputations = [100, 100, 100, 90, 80];
            const clientRewards = [100, 100, 100, 90, 80];
            // **************************************
            const tx = await this.contract.provideData(requestId, newModelAddress, clientIds, clientNewReputations, clientRewards);
            await tx.wait();
            console.log(`Provided data for request ${requestId}: ${newModelAddress}`);
        });

        this.contract.on("RewardPaid", async (clientId, reward) => {
            console.log(`client ${clientId} received reward ${reward}`);
        });

        // emit DepositReturned(clientId, clientIdDeposit[clientId]);
        this.contract.on("DepositReturned", async (clientId, deposit) => {
            console.log(`client ${clientId} received deposit`);
        });
    }
}

module.exports = ContractListener;
