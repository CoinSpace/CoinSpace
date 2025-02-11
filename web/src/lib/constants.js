import { CsWallet } from '@coinspace/cs-common';

export const BITCOIN_FAMILY = [
  'bitcoin',
  'bitcoin-cash',
  'litecoin',
  'dash',
  'dogecoin',
];

export const EVM_FAMILY = [
  'ethereum',
  'ethereum-classic',
  'polygon',
  'avalanche-c-chain',
  'binance-smart-chain',
  'arbitrum',
  'optimism',
  'fantom',
  'base',
];

export const SUPPORTED_PLATFORMS = [
  ...BITCOIN_FAMILY,
  ...EVM_FAMILY,
  'ripple',
  'stellar',
  'monero',
  'eos',
  'solana',
  'tron',
  'cardano',
  'toncoin',
  'sui',
];

export const TOKEN_PLATFORMS = [
  'arbitrum',
  'avalanche-c-chain',
  'base',
  'binance-smart-chain',
  'ethereum',
  'fantom',
  'optimism',
  'polygon',
  'solana',
  'sui',
  'toncoin',
  'tron',
];

export async function loadWalletModule(platform) {
  if (BITCOIN_FAMILY.includes(platform)) {
    return (await import('@coinspace/cs-bitcoin-wallet')).default;
  }
  if (['solana'].includes(platform)) {
    return (await import('@coinspace/cs-solana-wallet')).default;
  }
  if (['monero'].includes(platform)) {
    return (await import('@coinspace/cs-monero-wallet')).default;
  }
  if (['tron'].includes(platform)) {
    return (await import('@coinspace/cs-tron-wallet')).default;
  }
  if (['cardano'].includes(platform)) {
    return (await import('@coinspace/cs-cardano-wallet')).default;
  }
  if (['ripple'].includes(platform)) {
    return (await import('@coinspace/cs-ripple-wallet')).default;
  }
  if (['stellar'].includes(platform)) {
    return (await import('@coinspace/cs-stellar-wallet')).default;
  }
  if (['eos'].includes(platform)) {
    return (await import('@coinspace/cs-eos-wallet')).default;
  }
  if (EVM_FAMILY.includes(platform)) {
    return (await import('@coinspace/cs-evm-wallet')).default;
  }
  if (['toncoin'].includes(platform)) {
    return (await import('@coinspace/cs-toncoin-wallet')).default;
  }
  if (['sui'].includes(platform)) {
    return (await import('@coinspace/cs-sui-wallet')).default;
  }
  // fallback
  return CsWallet;
}

export function getApiNode(platform, isOnion) {
  switch (platform) {
    // Bitcoin-like
    case 'bitcoin':
      return isOnion ? import.meta.env.VITE_API_BTC_URL_TOR : import.meta.env.VITE_API_BTC_URL;
    case 'bitcoin-cash':
      return isOnion ? import.meta.env.VITE_API_BCH_URL_TOR : import.meta.env.VITE_API_BCH_URL;
    case 'dash':
      return isOnion ? import.meta.env.VITE_API_DASH_URL_TOR : import.meta.env.VITE_API_DASH_URL;
    case 'dogecoin':
      return isOnion ? import.meta.env.VITE_API_DOGE_URL_TOR : import.meta.env.VITE_API_DOGE_URL;
    case 'litecoin':
      return isOnion ? import.meta.env.VITE_API_LTC_URL_TOR : import.meta.env.VITE_API_LTC_URL;
    // Ethereum-like
    case 'ethereum':
      return isOnion ? import.meta.env.VITE_API_ETH_URL_TOR : import.meta.env.VITE_API_ETH_URL;
    case 'ethereum-classic':
      return isOnion ? import.meta.env.VITE_API_ETC_URL_TOR : import.meta.env.VITE_API_ETC_URL;
    case 'binance-smart-chain':
      return isOnion ? import.meta.env.VITE_API_BSC_URL_TOR : import.meta.env.VITE_API_BSC_URL;
    case 'polygon':
      return isOnion ? import.meta.env.VITE_API_POLYGON_URL_TOR : import.meta.env.VITE_API_POLYGON_URL;
    case 'avalanche-c-chain':
      return isOnion ? import.meta.env.VITE_API_AVAX_URL_TOR : import.meta.env.VITE_API_AVAX_URL;
    case 'arbitrum':
      return isOnion ? import.meta.env.VITE_API_ARB_URL_TOR : import.meta.env.VITE_API_ARB_URL;
    case 'optimism':
      return isOnion ? import.meta.env.VITE_API_OP_URL_TOR : import.meta.env.VITE_API_OP_URL;
    case 'fantom':
      return isOnion ? import.meta.env.VITE_API_FTM_URL_TOR : import.meta.env.VITE_API_FTM_URL;
    case 'base':
      return isOnion ? import.meta.env.VITE_API_BASE_URL_TOR : import.meta.env.VITE_API_BASE_URL;
    // Ripple-like
    case 'ripple':
      return isOnion ? import.meta.env.VITE_API_XRP_URL_TOR : import.meta.env.VITE_API_XRP_URL;
    case 'stellar':
      return isOnion ? import.meta.env.VITE_API_XLM_URL_TOR : import.meta.env.VITE_API_XLM_URL;
    // Others
    case 'monero':
      return isOnion ? import.meta.env.VITE_API_XMR_URL_TOR : import.meta.env.VITE_API_XMR_URL;
    case 'eos':
      return isOnion ? import.meta.env.VITE_API_EOS_URL_TOR : import.meta.env.VITE_API_EOS_URL;
    case 'solana':
      return isOnion ? import.meta.env.VITE_API_SOL_URL_TOR : import.meta.env.VITE_API_SOL_URL;
    case 'tron':
      return isOnion ? import.meta.env.VITE_API_TRX_URL_TOR : import.meta.env.VITE_API_TRX_URL;
    case 'cardano':
      return isOnion ? import.meta.env.VITE_API_ADA_URL_TOR : import.meta.env.VITE_API_ADA_URL;
    case 'toncoin':
      return isOnion ? import.meta.env.VITE_API_TON_URL_TOR : import.meta.env.VITE_API_TON_URL;
    case 'sui':
      return isOnion ? import.meta.env.VITE_API_SUI_URL_TOR : import.meta.env.VITE_API_SUI_URL;
    default:
      // fallback
      return 'https://unsupported.coin.space/';
  }
}
