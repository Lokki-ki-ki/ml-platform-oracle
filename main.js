require('dotenv').config();
const { ethers } = require("ethers");
const contractABI = require('./MlPlatformFactory.json');
const PlatformListener = require('./platformListener');

const provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;

const mlPlatformListener = new PlatformListener(
    process.env.CONTRACT_ADDRESS,
    contractABI.abi,
    provider,
    "https://kkiwonderland.tech/api/evaluator",
    ORACLE_PRIVATE_KEY
);


