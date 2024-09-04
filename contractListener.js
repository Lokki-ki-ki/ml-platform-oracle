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

        const blockNumber = await this.provider.getBlockNumber();
        console.log(`Start listening for events on contract: ${this.contract.address} at block: ${blockNumber}`);
        // event StartEvent(uint256 requestId);
        this.contract.on("StartEvent", async (requestId, _rewardPool) => {
            console.log(`Received start event for request ${requestId}`);
            this.requests[requestId] = { "clientsToSubmissions" : {}, "clientsToReputation" : {}};
            this.requests[requestId]["rewardPool"] = _rewardPool.toString();
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
            // TODO: test this
            const getResponse = async () => {
                let res = {};
                try {
                    const axios = require('axios');
                    const response = await axios.post(this.backendURL, requestBody)
                        .then(response => {
                            console.log(`Received response: ${response.data}`);
                            raw = response.data;
                            res["newModelAddress"] = raw.newModelAddress;
                            res["clientIds"] = raw.clientIds;
                            res["clientNewReputations"] = Object.values(raw.clientNewReputations);
                            res["clientRewards"] = Object.values(raw.clientRewards);
                        })
                        .catch(error => {
                            console.error(`Error: ${error}`);
                            return error;
                        });
                } catch (error) {
                    res["newModelAddress"] = "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe";
                    res["clientIds"] = [1, 2, 3, 4, 5];
                    res["clientNewReputations"] = [100, 100, 100, 90, 80];
                    res["clientRewards"] = ["100000000000000000", "100000000000000000","100000000000000000","100000000000000000","100000000000000000"];
                }
                return res;
            }

            // Provide data back to the contract
            // ********** Dummy data start **********
            // dummy_results = {
            //     newModelAddress: "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe",
            //     clientIds: ["1", "2", "3", "4", "5"],
            //     clientNewReputations: [100, 100, 100, 90, 80],
            //     clientRewards: [100, 100, 100, 90, 80]
            // }
            // {"newModelAddress": "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe", "clientIds": ["1", "2", "3", "4", "5"], "clientNewReputations": [100, 100, 100, 90, 80], "clientRewards": [100, 100, 100, 90, 80]}
            // const newModelAddress = "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe";
            // const clientIds = ["1", "2", "3", "4", "5"];
            // const clientNewReputations = [100, 100, 100, 90, 80];
            // const clientRewards = [100, 100, 100, 90, 80];

            const sendBack = async () => {
                res = await getResponse();
                const newModelAddress = res.newModelAddress;
                const clientIds = res.clientIds;
                const clientNewReputations = res.clientNewReputations;
                const clientRewards = res.clientRewards.map(x => x.toString());
                const tx = await this.contract.provideData(requestId, newModelAddress, clientIds, clientNewReputations, clientRewards);
                await tx.wait();
                console.log(`Provided data for request ${requestId}: ${newModelAddress}`);
            }
            
            sendBack();

        });

        this.contract.on("RewardPaid", async (clientId, reward, roundOfTraining, clientAddress) => {
            console.log(`client ${clientId} received reward ${reward} for ${roundOfTraining}`);
        });

        // emit DepositReturned(clientId, clientIdDeposit[clientId]);
        this.contract.on("DepositReturned", async (clientId, deposit, roundOfTraining, clientAddress) => {
            console.log(`client ${clientId} received deposit ${deposit} for ${roundOfTraining}`);
        });
    }
}

module.exports = ContractListener;
