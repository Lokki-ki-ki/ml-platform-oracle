const { ethers } = require("ethers");
const contractABI = require('./MlContract.json');
const ContractListener = require('./contractListener');

class PlatformListener {
    constructor(contractAddress, contractABI, provider, backendURL, ORACLE_PRIVATE_KEY) {
        this.signer = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
        this.ORACLE_PRIVATE_KEY = ORACLE_PRIVATE_KEY;
        this.provider = provider;
        this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
        this.contractInstances = {}
        this.getPastContracts();
    }

    async getPastContracts() {
        const pastEvents = await this.contract.queryFilter("MlPlatformCreated");
        pastEvents.forEach(event => {
            const contractAddress = event.args[1];
            const newinstance = new ContractListener(
                contractAddress,
                contractABI.abi,
                this.provider,
                "https://kkiwonderland.tech/api/evaluator",
                this.ORACLE_PRIVATE_KEY
            );
            newinstance.listenForEvents();
            this.contractInstances[contractAddress] = newinstance;
            console.log(`Added new contract instance for ${contractAddress}`);
        });
    }

    async listenForEvents() {
    // event MlPlatformCreated(address indexed owner, address mlPlatformAddress, uint256 contractId, uint256 ddlTimestamp, uint256 depositRequired);

    // event MlPlatformCreated(address indexed owner, address mlPlatformAddress, uint256 contractId, uint256 ddlTimestamp, uint256 depositRequired);
        this.contract.on("MlPlatformCreated", async (owner, mlPlatformAddress, contractId, ddlTimestamp, depositRequired) => {
            console.log(`Received event MlPlatformCreated for contract ${mlPlatformAddress}`);
            if (this.contractInstances[mlPlatformAddress]) {
                console.log(`Contract instance already exists for ${mlPlatformAddress}`);
                return;
            }
            const newinstance = new ContractListener(
                mlPlatformAddress,
                contractABI.abi,
                this.provider,
                "https://kkiwonderland.tech/api/evaluator",
                this.ORACLE_PRIVATE_KEY
            );
            newinstance.listenForEvents();
            this.contractInstances[mlPlatformAddress] = newinstance;
            console.log(`Added new contract instance for ${mlPlatformAddress}`);
        });
    }
}

module.exports = PlatformListener;
