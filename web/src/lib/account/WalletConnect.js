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
        logger: 'fatal',
      }),
      metadata: {
        name: 'Coin Wallet',
        description: 'Coin Wallet is a non-custodial multicurrency wallet for multiple platforms.',
        url: 'https://coin.space/',
        icons: [],
      },
    });
    this.#web3wallet.on('session_proposal', (args) => this.#onSessionProposal(args));
    this.#web3wallet.on('auth_request', (args) => this.#onAuthRequest(args));
    this.#web3wallet.on('session_request', (args) => this.#onSessionRequest(args));
    this.#web3wallet.on('session_delete', (args) => this.#onSessionDelete(args));
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
    const proposalPromise = new Promise((resolve, reject) => {
      this.once('session_proposal', resolve);
      this.once('auth_request', (request) => {
        console.error(`Unsupported AuthRequest: ${JSON.stringify(request)}`);
        reject(new Error('Not supported'));
      });
    });
    try {
      await this.#web3wallet.pair({ uri });
      return await proposalPromise;
    } finally {
      this.removeAllListeners('session_proposal');
      this.removeAllListeners('auth_request');
    }
  }

  async approveSession(proposal) {
    if (proposal.verifyContext?.verified?.isScam === true) {
      await this.#web3wallet.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
      throw new Error('Scam');
    }
    const chains = [];
    const accounts = [];
    for (const wallet of this.#account.wallets()) {
      if (wallet.isWalletConnectSupported) {
        chains.push(wallet.chainId);
        accounts.push(wallet.accountId);
      }
    }
    let namespaces;
    try {
      namespaces = buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces: {
          eip155: {
            chains,
            accounts,
            methods: [
              'eth_sendTransaction',
              'personal_sign',
              'eth_sign',
              'eth_signTypedData',
              'eth_signTypedData_v4',
            ],
            events: ['accountsChanged', 'chainChanged'],
          },
        },
      });
    } catch (err) {
      console.error(err);
      await this.#web3wallet.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
      throw err;
    }
    this.#session = await this.#web3wallet.approveSession({
      id: proposal.id,
      namespaces,
    });
    return this.#session;
  }

  async rejectSession(proposal) {
    await this.#web3wallet.rejectSession({
      id: proposal.id,
      reason: getSdkError('USER_REJECTED'),
    });
  }

  async disconnectSession() {
    if (this.#session) {
      try {
        await this.#web3wallet.disconnectSession({
          topic: this.#session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
        this.#session = undefined;
      } catch (err) {
        console.error(err);
      }
    }
  }

  async getPendingSessionRequests() {
    if (this.#session) {
      try {
        const requests = await this.#web3wallet.getPendingSessionRequests();
        for (const request of requests) {
          if (this.#onSessionRequest(request)) {
            break;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  #onSessionProposal(proposal) {
    this.emit('session_proposal', proposal);
  }

  #onAuthRequest(request) {
    this.emit('auth_request', request);
  }

  #onSessionRequest(request) {
    if (this.#session) {
      if (this.#session.topic === request.topic && request.params.request.expiryTimestamp * 1000 > Date.now()) {
        if (request.params.request.method === 'eth_sendTransaction') {
          this.emit('eth_sendTransaction', request);
          return true;
        }
        if (request.params.request.method === 'eth_signTypedData'
          || request.params.request.method === 'eth_signTypedData_v4') {
          this.emit('eth_signTypedData', request);
          return true;
        }
        if (request.params.request.method === 'eth_sign'
          || request.params.request.method === 'personal_sign') {
          this.emit('eth_sign', request);
          return true;
        }
        console.error(`Unsupported SessionRequest '${request?.params?.request?.method}': ${JSON.stringify(request)}`);
        this.#web3wallet.respondSessionRequest({
          topic: this.#session.topic,
          response: formatJsonRpcError(request.id, getSdkError('UNSUPPORTED_METHODS')),
        }).catch(console.error);
      }
      return false;
    }
  }

  #onSessionDelete(session) {
    if (this.#session.topic === session.topic) {
      this.#session = undefined;
      this.emit('disconnect');
    }
  }

  async resolveSessionRequest(request, result) {
    try {
      await this.#web3wallet.respondSessionRequest({
        topic: this.#session.topic,
        response: formatJsonRpcResult(request.id, result),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async rejectSessionRequest(request, error) {
    try {
      await this.#web3wallet.respondSessionRequest({
        topic: this.#session.topic,
        response: formatJsonRpcError(request.id, error || getSdkError('USER_REJECTED')),
      });
    } catch (err) {
      console.error(err);
    }
  }
}
