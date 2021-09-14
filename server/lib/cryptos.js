'use strict';

// TODO: update it
async function getAll() {
  return [
    {
      "_id": "bitcoin@bitcoin",
      "asset": "bitcoin",
      "platform": "bitcoin",
      "type": "coin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "decimals": 8,
      "logo": "bitcoin.svg",
      "changelly": {
        "ticker": "btc"
      },
      "coingecko": {
        "id": "bitcoin"
      },
      "moonpay": {
        "id": "a18a8d0b-502c-48b9-ab6b-e2638fba5862",
        "code": "btc"
      },
    },
    {
      "_id": "litecoin@litecoin",
      "asset": "litecoin",
      "platform": "litecoin",
      "type": "coin",
      "name": "Litecoin",
      "symbol": "LTC",
      "decimals": 8,
      "logo": "litecoin.svg",
      "changelly": {
        "ticker": "ltc"
      },
      "coingecko": {
        "id": "litecoin"
      },
      "moonpay": {
        "id": "84bf7e0f-0a16-4486-8ba7-e80edcf5331e",
        "code": "ltc"
      },
    },
    {
      "_id": "dash@dash",
      "asset": "dash",
      "platform": "dash",
      "type": "coin",
      "name": "Dash",
      "symbol": "DASH",
      "decimals": 8,
      "logo": "dash.svg",
      "changelly": {
        "ticker": "dash"
      },
      "coingecko": {
        "id": "dash"
      },
      "moonpay": {
        "id": "747c243a-8365-444e-b22d-e1192a48301f",
        "code": "dash"
      }
    },
    {
      "_id": "bitcoin-cash@bitcoin-cash",
      "asset": "bitcoin-cash",
      "platform": "bitcoin-cash",
      "type": "coin",
      "name": "Bitcoin Cash",
      "symbol": "BCH",
      "decimals": 8,
      "logo": "bitcoin-cash.svg",
      "changelly": {
        "ticker": "bch"
      },
      "coingecko": {
        "id": "bitcoin-cash"
      },
      "moonpay": {
        "id": "b01f8f58-f915-491b-aadb-7ba6b966c861",
        "code": "bch"
      }
    },
    {
      "_id": "bitcoin-sv@bitcoin-sv",
      "asset": "bitcoin-sv",
      "platform": "bitcoin-sv",
      "type": "coin",
      "name": "Bitcoin SV",
      "symbol": "BSV",
      "decimals": 8,
      "logo": "bitcoin-sv.svg",
      "changelly": {
        "ticker": "bsv"
      },
      "coingecko": {
        "id": "bitcoin-cash-sv"
      }
    },
    {
      "_id": "ethereum@ethereum",
      "asset": "ethereum",
      "platform": "ethereum",
      "type": "coin",
      "name": "Ethereum",
      "symbol": "ETH",
      "decimals": 18,
      "logo": "ethereum.svg",
      "changelly": {
        "ticker": "eth"
      },
      "coingecko": {
        "id": "ethereum"
      },
      "moonpay": {
        "id": "8d305f63-1fd7-4e01-a220-8445e591aec4",
        "code": "eth"
      },
    },
    {
      "_id": "tether@ethereum",
      "asset": "tether",
      "platform": "ethereum",
      "type": "token",
      "name": "Tether",
      "symbol": "USDT",
      "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "decimals": 6,
      "logo": "tether.svg",
      "changelly": {
        "ticker": "usdt20"
      },
      "coingecko": {
        "id": "tether",
        "platform": "ethereum"
      },
      "moonpay": {
        "id": "3693a9c0-7b24-4e48-a8a7-75021ad6e26a",
        "code": "usdt"
      },
    },
    {
      "_id": "dodo@ethereum",
      "asset": "dodo",
      "platform": "ethereum",
      "type": "token",
      "name": "DODO",
      "symbol": "DODO",
      "address": "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
      "decimals": 18,
      "logo": "dodo.png",
      "coingecko": {
        "id": "dodo",
        "platform": "ethereum"
      }
    },
    {
      "_id": "dogecoin@dogecoin",
      "asset": "dogecoin",
      "platform": "dogecoin",
      "type": "coin",
      "name": "Dogecoin",
      "symbol": "DOGE",
      "decimals": 8,
      "logo": "dogecoin.svg",
      "changelly": {
        "ticker": "doge"
      },
      "coingecko": {
        "id": "dogecoin"
      },
      "moonpay": {
        "id": "af950192-8e01-4a84-9807-27f16d88450e",
        "code": "doge"
      }
    },
    {
      "_id": "binance-smart-chain@binance-smart-chain",
      "asset": "binance-smart-chain",
      "platform": "binance-smart-chain",
      "type": "coin",
      "name": "Binance Smart Chain",
      "symbol": "BNB",
      "decimals": 18,
      "logo": "binance-smart-chain.svg",
      "coingecko": {
        "id": "binancecoin"
      },
      "moonpay": {
        "id": "7ddb22ce-792b-401d-a8ea-62260f59bc62",
        "code": "bnb_bsc"
      }
    },
    {
      "_id": "atari@binance-smart-chain",
      "asset": "atari",
      "platform": "binance-smart-chain",
      "type": "token",
      "name": "Atari",
      "symbol": "ATRI",
      "address": "0xc0c6e4c6e70c6231b20979bda581a66f062a7967",
      "decimals": 0,
      "logo": "atari.png",
      "coingecko": {
        "id": "atari",
        "platform": "binance-smart-chain"
      }
    },
    {
      "_id": "xrp@ripple",
      "asset": "xrp",
      "platform": "ripple",
      "type": "coin",
      "name": "XRP",
      "symbol": "XRP",
      "decimals": 6,
      "logo": "xrp.svg",
      "changelly": {
        "ticker": "xrp"
      },
      "coingecko": {
        "id": "ripple"
      },
      "moonpay": {
        "id": "d64b5e09-3d1b-452d-ab28-478c4190de7d",
        "code": "xrp"
      }
    },
    {
      "_id": "stellar@stellar",
      "asset": "stellar",
      "platform": "stellar",
      "type": "coin",
      "name": "Stellar",
      "symbol": "XLM",
      "decimals": 7,
      "logo": "stellar.svg",
      "changelly": {
        "ticker": "xlm"
      },
      "coingecko": {
        "id": "stellar"
      },
      "moonpay": {
        "id": "c8b1ef20-3703-4a66-9ea1-c13ce0d893bf",
        "code": "xlm"
      }
    },
    {
      "_id": "eos@eos",
      "asset": "eos",
      "platform": "eos",
      "type": "coin",
      "name": "EOS",
      "symbol": "EOS",
      "decimals": 4,
      "logo": "eos.svg",
      "changelly": {
        "ticker": "eos"
      },
      "coingecko": {
        "id": "eos"
      },
      "moonpay": {
        "id": "9fdb4e4e-feda-4a81-8b26-1401b6c2f4de",
        "code": "eos"
      }
    },
    {
      "_id": "monero@monero",
      "asset": "monero",
      "platform": "monero",
      "type": "coin",
      "name": "Monero",
      "symbol": "XMR",
      "decimals": 12,
      "logo": "monero.svg",
      "changelly": {
        "ticker": "xmr"
      },
      "coingecko": {
        "id": "monero"
      }
    }
  ];
}

export default {
  getAll,
};
