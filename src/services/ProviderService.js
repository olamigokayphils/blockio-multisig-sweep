const constants = require("../constants");
const fetch = require("node-fetch");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ProviderService = function (provider, network) {
  const providerIndex = Object.values(constants.PROVIDERS).indexOf(provider);
  if (providerIndex < 0) {
    throw new Error("Blockchain provider not supported");
  }
  const providerKey = Object.keys(constants.PROVIDER_URLS)[providerIndex];
  if (constants.PROVIDER_URLS[providerKey].SUPPORT.indexOf(network) < 0) {
    throw new Error("Network not supported by provider");
  }
  this.network = network;
  this.provider = provider;
};

ProviderService.prototype.getTxHex = async function (txId) {
  try {
    switch (this.provider) {
      case constants.PROVIDERS.SOCHAIN: {
        const apiUrl = [constants.PROVIDER_URLS.SOCHAIN.URL, "get_tx", this.network, txId].join("/");
        const res = await fetchUrl(apiUrl);
        const json = await res.json();
        if (json.status === "fail") {
          throw new Error(JSON.stringify(json.data));
        }
        return json.data.tx_hex;
      }
      case constants.PROVIDERS.MEMPOOLSPACE: {
        const networkType = this.network === constants.NETWORKS.BTC ? "api" : "testnet/api";
        const apiUrl = [constants.PROVIDER_URLS.MEMPOOLSPACE.URL, networkType, "tx", txId, "hex"].join("/");
        const res = await fetchUrl(apiUrl);
        const hex = await res.text();
        if (res.status !== 200) {
          throw new Error(hex);
        }
        return hex;
      }
      case constants.PROVIDERS.BLOCKCHAINCOM: {
        const apiUrl = [constants.PROVIDER_URLS.BLOCKCHAINCOM.URL, "rawtx", txId, "?format=hex"].join("/");
        const res = await fetchUrl(apiUrl);
        const hex = await res.text();
        if (res.status !== 200) {
          throw new Error(hex);
        }
        return hex;
      }

      case constants.PROVIDERS.BLOCKCYPHER: {
        const apiUrl = [constants.PROVIDER_URLS.BLOCKCYPHER.URL, this.network.toLowerCase(), "main/txs", txId, "?includeHex=true"].join("/");
        const res = await fetchUrl(apiUrl);
        const json = await res.json();
        if (!json.hex) {
          throw new Error(`Error obtaing hex from ${this.provider} server`);
        }
        return json.hex;
      }

      default: {
        throw new Error("Could not get hex with provider: " + this.provider);
      }
    }
  } catch (err) {
    throw new Error(err);
  }
};

ProviderService.prototype.getUtxo = async function (addr) {
  try {
    switch (this.provider) {
      case constants.PROVIDERS.SOCHAIN: {
        const apiUrl = [constants.PROVIDER_URLS.SOCHAIN.URL, "get_tx_unspent", this.network, addr].join("/");
        const res = await fetchUrl(apiUrl);
        const json = await res.json();
        if (json.status === "fail") {
          throw new Error(JSON.stringify(json.data));
        }
        return json.data.txs;
      }
      case constants.PROVIDERS.BLOCKCHAINCOM: {
        const apiUrl = [constants.PROVIDER_URLS.BLOCKCHAINCOM.URL, "unspent?active=" + addr].join("/");
        const res = await fetchUrl(apiUrl);
        const json = await res.json();
        if (json.error) {
          throw new Error(json.message);
        }
        return json.unspent_outputs;
      }
      case constants.PROVIDERS.BLOCKCYPHER: {
        const apiUrl = [constants.PROVIDER_URLS.BLOCKCYPHER.URL, this.network.toLowerCase(), "main/addrs", addr + "?unspentOnly=true&includeScript=true"].join("/");
        const res = await fetchUrl(apiUrl);
        const json = await res.json();
        if (json.error) {
          throw new Error(json.message);
        }
        return json.txrefs || [];
      }
      default: {
        throw new Error("Could not get utxo with provider: " + this.provider);
      }
    }
  } catch (err) {
    throw new Error(err);
  }
};

ProviderService.prototype.sendTx = async function (txHex) {
  try {
    switch (this.provider) {
      case constants.PROVIDERS.SOCHAIN: {
        const apiUrl = [constants.PROVIDER_URLS.SOCHAIN.URL, "send_tx", this.network].join("/");
        await broadcastTx(apiUrl, this.network.toLowerCase(), txHex);
        return;
      }

      case constants.PROVIDERS.BLOCKCHAINCOM:
      case constants.PROVIDERS.BLOCKCYPHER: {
        const apiUrl = [constants.PROVIDER_URLS.BLOCKCYPHER.URL, this.network.toLowerCase(), "main", "txs", "push"].join("/");
        await broadcastTx(apiUrl, this.network.toLowerCase(), txHex);
        return;
      }
      default: {
        throw new Error("Could not send tx with provider: " + this.provider);
      }
    }
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = ProviderService;

async function fetchUrl(url) {
  try {
    let response = await fetch(url);
    if (response.ok) {
      return response;
    } else {
      console.log(" -- retrying in 10 seconds due to status = " + response.status);
      await delay(10000);
      return await fetchUrl(url);
    }
  } catch (err) {
    throw new Error(err);
  }
}

async function broadcastTx(apiUrl, network, txHex) {
  try {
    let res;
    if (apiUrl == [constants.PROVIDER_URLS.BLOCKCYPHER.URL, network, "main", "txs", "push"].join("/")) {
      res = await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify({ tx: txHex }),
        headers: { "Content-Type": "application/json" },
      });
      res = await res.json();
      console.log(res);
    } else {
      res = await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify({ tx_hex: txHex }),
        headers: { "Content-Type": "application/json" },
      });
      res = await res.json();
    }
    if (res.status === "success" || res.tx?.received) {
      console.log("Sweep Success!");
      console.log("Tx_id:", res.data.txid || res.tx?.hash);
    } else {
      console.log("Sweep Failed:");
      throw new Error(JSON.stringify(res.data));
    }
  } catch (err) {
    throw new Error(err);
  }
}
