- Reference sweep script for Basic (2-of-2) MultiSig wallets. NodeJS.
- This repository was originally cloned from [BlockIo Sweep](https://github.com/BlockIo/blockio-basic-multisig-sweep) Using [SoChain API](https://sochain.com/api) by default. It became imperative to move on from their Sochain API after more customers started complaining about account getting frozen for no clear reason on BlockIo and the Sochain Became a paid service.

- This project now leverages [Blockchain.com Free Service](https://blockchain.com) and [Blockcypher](https://blockcypher.com/) for data and for broadcasting transactions. You can certainly implement your own backends yourself.

- Ensure you've backed up your Keys from BlockIo

- NEVER SHARE YOUR PRIVATE KEYS. NEVER USE PRIVATE KEYS ON INSECURE SYSTEMS.

#### HOW TO RUN

```
$ git clone <repository URL>
$ cd <dir> && npm install

```

Create your `.env` file in the root directory using the `.env.example` format.

- N is the number of addresses you've generated on the given network
- PRIVATE_KEY1_BIP32 is the BIP32 extended private key you backed up
- PRIVATE_KEY2 is the second private key you backed up
- DESTINATION_ADDR is where you want the swept coins to go
- NETWORK is the network for which you're sweeping coins
- DERIVATION_PATH is the derivation path shown when you back up your private keys

```
$ node index.js
```
