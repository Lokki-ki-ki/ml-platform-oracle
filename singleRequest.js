require('dotenv').config();
const { ethers } = require("ethers");

contractAddress="0x32CB58439FC83060B811Aa63C569Cc63dEA63FdC"

const contractABI = require('./MlContract.json');
const provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;

requestBody = {"clientsToSubmissions":{"1":"QmdfzatZMtMmaWMTNsJuvCQcBbHAQFSGTrYLi6CiZ5fWTi","2":"QmX4T5dLBrubvGmUJnkM1tP1j8oPC5ZwDMUWdDR1R9wWNN","3":"QmTCxkXPG9fetQs1mP6QmQDWAx5vUc325u8AndPquJQv62","4":"QmPZeG6uJsX1EsKd4BeR5cPNBScAwpU7CLXRGXrEgbUpSV","5":"Qmc8VCb4DWZbXxhqcCCsqdVoYiGqrmkVbQ4fHPhYopRwS1"},"clientsToReputation":{"1":"100","2":"100","3":"100","4":"100","5":"100"},"rewardPool":"1000000000000000000","modelAddress":"QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe","testDataAddress":"Qmeo6yw83vLYX3zkgPDiGK24FB99pz1PX1EngLHLPyko76","testLabelAddress":"QmWTBKyjTsuHHq6kHdCnbvF3PQZDQa2pincoyAc8DzisFX","testDataHash":"64d59ad605ca4af2b947844984c54f11409928c2ad9880f864ee7459bb17e308","testLabelHash":"ae416418d6466f81e7a63f0d8c09400fa221c6389eca6c67d7b12370715c385c"};
const axios = require('axios');
signer = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);

contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

const getReponse = async () => {
    let res = {};
    try {
        const response = await axios.post("https://kkiwonderland.tech/api/evaluator", requestBody)
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
    console.log(res); 
    return res;
}

const sendBack = async () => {
    // const res = await getReponse();

    res = {}
    res["newModelAddress"] = "QmYEMkTVdYF7bBoJ28D2Lrqex1xozLZ5yHQ8pjDuJ18zQe";
    res["clientIds"] = [1, 2, 3, 4, 5];
    res["clientNewReputations"] = [100, 100, 100, 90, 80];
    res["clientRewards"] = ["103000000000000000", "20000000000000000","44000000000000000","14400000000000000","5500000000000000"];

    const newModelAddress = res.newModelAddress;
    const clientIds = res.clientIds;
    const clientNewReputations = res.clientNewReputations;
    const clientRewards = res.clientRewards.map(x => x.toString());

    const tx = await contract.provideData(1, newModelAddress, clientIds, clientNewReputations, clientRewards);
    await tx.wait();
    console.log(`Provided data for request ${1}: ${newModelAddress}`);
}

sendBack();



