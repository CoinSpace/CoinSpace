# Security

Report vulnerabilities to **support@coin.space**.

Do not open a public GitHub issue for a security bug. This repository does not yet have GitHub private vulnerability reporting enabled; until it does, email is the only channel that stays off the issue tracker.

PGP is not published. Send the report in the body of the mail (or a `.zip`). If the write-up cannot travel in the clear, say so in the first message and wait for a reply before attaching keys, seeds, or customer data.

## What to send

One mail, English, with:

1. Affected product and version (Coin Wallet app build, or git commit of this repo / a `cs-*-wallet` package).
2. The trust boundary that fails (who can invoke it, what is signed or stored, what the UI showed).
3. Steps on **your own** wallet or a local build. No other users’ accounts, no production seed phrases.
4. Impact: funds, keys, session tokens, or integrity of `api.coin.space` / `coin.space`.
5. A patch or a precise file:line if you have one. Not required.

We do not need a public PoC, a scanner dump, or a video of a mainnet drain.

## Safe harbor

If you are acting in good faith, on your own test accounts, without degrading the service or touching other people’s money, we will not bring a legal claim for that research.

Give us a reasonable window to ship a fix before you publish. We will try to keep you informed. We do not promise a calendar date in this file.

## Bounty

Qualifying reports may be rewarded in **bitcoin**. Amounts are at our discretion; a clear, original report is worth more than a duplicate with a louder title.

The living bounty rules are on Support:

https://support.coin.space/hc/en-us/articles/115001730468-Does-Coin-Wallet-have-a-bug-bounty-program

HackerOne (`hackerone.com/coinspace`) is **not** accepting submissions.

Ineligible: employees and contractors; residents of jurisdictions we cannot pay.

## Scope

In, when the bug is in code we ship or run:

| Surface | Where |
|---------|--------|
| Coin Wallet clients | this repo: `web/`, `electron/`, `phonegap/` (Web, iOS, Android, desktop, Tor) |
| Account API | this repo: `server/` (`/api/v1` … `/api/v4`) |
| Bitcoin-class wallets | [`cs-bitcoin-wallet`](https://github.com/CoinSpace/cs-bitcoin-wallet) — BTC, BCH, LTC, DASH, DOGE |
| EVM wallets | [`cs-evm-wallet`](https://github.com/CoinSpace/cs-evm-wallet) — ETH, ETC, BNB, POL, AVAX, ARB, OP, FTM, Base, Sonic and tokens on those chains |
| Other coin modules | `cs-cardano-wallet`, `cs-monero-wallet`, `cs-solana-wallet`, `cs-stellar-wallet`, `cs-sui-wallet`, `cs-toncoin-wallet`, `cs-tron-wallet`, `cs-ripple-wallet`, `cs-common` |
| Site | https://coin.space (the wallet origin, not the help centre) |

Issues we care about first: theft or freeze of funds, seed / PIN / wallet-token exposure, signing bytes the confirm screen did not show (WalletConnect, BIP-21, swap deposit), unauthenticated writes on the account API, remote code execution in a client.

Out:

- Help centre, blog, status, and other hosts we do not operate (`support.coin.space`, and similar).
- WalletConnect cloud, swap desks (Changelly, ChangeNOW, …), ramps, Blockchair, Sentry, BrowserStack, Apple/Google/Electron stores.
- npm/GitHub dependencies, unless you show the bug in **our** use of them.
- Clickjacking, missing headers, SPF/DKIM, and version banners with no path to funds or keys.
- Automated scanner output with no working case.
- Social engineering, physical theft, and DoS.

## This file

Canonical copy: the `SECURITY.md` at the root of [CoinSpace/CoinSpace](https://github.com/CoinSpace/CoinSpace). Sibling wallet repos should point here rather than invent a second inbox.
