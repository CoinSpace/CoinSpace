import { Core } from '@walletconnect/core';
import { EventEmitter } from 'events';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';

export class WalletConnect extends EventEmitter {
  #account;
  #web3wallet;
  #session;

  constructor({ account }) {
    super();
    this.#account = account;
  }

  async init() {
    this.#web3wallet = await Web3Wallet.init({
      core: new Core({
        projectId: import.meta.env.VITE_WALLETCONNECT_ID,
      }),
      metadata: {
        name: 'Coin Wallet',
        description: 'Coin Wallet is the most popular and secure non-custodial multicurrency wallet',
        //url: 'www.walletconnect.com',
        icons: [],
      },
    });
    this.#web3wallet.on('session_request', (args) => this.#onSessionRequest(args));
    this.#web3wallet.on('session_delete', (args) => this.#onSessionDelete(args));
    // TODO session_update ?
    try {
      const sessions = await this.#web3wallet.getActiveSessions();
      for (const topic in sessions) {
        await this.#web3wallet.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      }
    } catch (err) {
      console.error(err);
    }
    return this;
  }

  async pair(uri) {
    const onSessionProposal = new Promise((resolve) => {
      this.#web3wallet.once('session_proposal', resolve);
    });
    await this.#web3wallet.pair({ uri });
    return onSessionProposal;
  }

  async approveSession(proposal) {
    const chains = [];
    const accounts = [];
    for (const wallet of this.#account.wallets()) {
      if (wallet.isWalletConnectSupported) {
        chains.push(wallet.chainId);
        accounts.push(wallet.accountId);
      }
    }
    try {
      const namespaces = buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces: {
          eip155: {
            chains,
            accounts,
            methods: ['eth_sendTransaction', 'personal_sign'],
            events: ['accountsChanged', 'chainChanged'],
          },
        },
      });
      this.#session = await this.#web3wallet.approveSession({
        id: proposal.id,
        namespaces,
      });
      return this.#session;
    } catch (err) {
      await this.#web3wallet.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
    }
  }

  async rejectSession(proposal) {
    await this.#web3wallet.rejectSession({
      id: proposal.id,
      reason: getSdkError('USER_REJECTED'),
    });
  }

  async disconnectSession() {
    if (this.#session) {
      await this.#web3wallet.disconnectSession({
        topic: this.#session.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });
      this.#session = undefined;
    }
  }

  #onSessionRequest(request) {
    if (this.#session.topic === request.topic) {
      if (request.params.request.method === 'eth_sendTransaction') {
        this.emit('eth_sendTransaction', request);
      }
    }
  }

  #onSessionDelete(session) {
    if (this.#session.topic === session.topic) {
      this.#session = undefined;
      this.emit('disconnect');
    }
  }

  async resolveSessionRequest(request, result) {
    await this.#web3wallet.respondSessionRequest({
      topic: this.#session.topic,
      response: formatJsonRpcResult(request.id, result),
    });
  }

  async rejectSessionRequest(request, err) {
    await this.#web3wallet.respondSessionRequest({
      topic: this.#session.topic,
      response: formatJsonRpcError(request.id, err),
    });
  }
}
