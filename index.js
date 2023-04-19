const constants = require("./src/constants");
const Sweeper = require("./src/sweeper");

require("dotenv").config({ debug: true });
const n = process.env.N;
const bip32 = process.env.PRIVATE_KEY1_BIP32;
const privkey2 = process.env.PRIVATE_KEY2;
const toAddr = process.env.DESTINATION_ADDR;
const network = process.env.NETWORK;
const derivationPath = process.env.DERIVATION_PATH;

console.log({ n });

/** CHECK ENVIRONMENT VARIABLES */
if (!n || !bip32 || !privkey2 || !toAddr || !network || !derivationPath) {
  console.log("One or more required arguments are missing");
  process.exit(0);
}

let sweep;

if (network == constants.NETWORKS.BTC || network == constants.NETWORKS.BTCTEST) {
  sweep = new Sweeper(network, bip32, privkey2, toAddr, n, derivationPath);
} else {
  /** ASSERTS THAT BLOCKCYPHER API KEY/TOKEN IS AVAILABLE */
  if (!process.env.BLOCKCYPHER_API_KEY) {
    console.error("Consider adding 'BLOCKCYPHER_API_KEY' to your .env file. visit: https://accounts.blockcypher.com/signup");
    process.exit(0);
  }
  sweep = new Sweeper(network, bip32, privkey2, toAddr, n, derivationPath, { provider: constants.PROVIDERS.BLOCKCYPHER, key: process.env.BLOCKCYPHER_API_KEY });
}

Sweep();

async function Sweep() {
  try {
    await sweep.begin();
  } catch (err) {
    console.log(err);
  }
}
