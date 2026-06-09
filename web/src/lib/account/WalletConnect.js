import { Core } from '@walletconnect/core';
import { EventEmitter } from 'events';
import { WalletKit } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils';

export class WalletConnect extends EventEmitter {
  #account;
  #walletKit;
  #session;

  #SUPPORTED_NAMESPACES = {
    eip155: {
      methods: [
        'eth_sendTransaction',
        'personal_sign',
        'eth_sign',
        'eth_signTypedData',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'eth_requestAccounts',
      ],
      events: [
        'accountsChanged', 'chainChanged',
      ],
    },
  };

  constructor({ account }) {
    super();
    this.#account = account;
  }

  async init() {
    this.#walletKit = await WalletKit.init({
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
    this.#walletKit.on('session_proposal', (args) => this.#onSessionProposal(args));
    this.#walletKit.on('auth_request', (args) => this.#onAuthRequest(args));
    this.#walletKit.on('session_request', (args) => this.#onSessionRequest(args));
    this.#walletKit.on('session_delete', (args) => this.#onSessionDelete(args));
    try {
      const sessions = await this.#walletKit.getActiveSessions();
      for (const topic in sessions) {
        await this.#walletKit.disconnectSession({
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
      await this.#walletKit.pair({ uri });
      return await proposalPromise;
    } finally {
      this.removeAllListeners('session_proposal');
      this.removeAllListeners('auth_request');
    }
  }

  async approveSession(proposal) {
    if (!this.#isSupportedProposal(proposal)) {
      await this.#walletKit.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
      throw new Error('Not supported');
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
            ...this.#SUPPORTED_NAMESPACES.eip155,
            chains,
            accounts,
          },
        },
      });
    } catch (err) {
      await this.#walletKit.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
      throw err;
    }
    if (Object.keys(namespaces).length === 0) {
      throw new Error('Non conforming namespaces. approve() namespaces chains');
    }
    this.#session = await this.#walletKit.approveSession({
      id: proposal.id,
      namespaces,
    });
    this.#session.isScam = proposal.verifyContext?.verified?.isScam === true;
    return this.#session;
  }

  async rejectSession(proposal) {
    await this.#walletKit.rejectSession({
      id: proposal.id,
      reason: getSdkError('USER_REJECTED'),
    });
  }

  async disconnectSession() {
    if (this.#session) {
      try {
        await this.#walletKit.disconnectSession({
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
        const requests = await this.#walletKit.getPendingSessionRequests();
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
        if (request.params.request.method === 'wallet_switchEthereumChain') {
          this.rejectSessionRequest(request, 'Unknown wallet chainId');
          return true;
        }
        console.error(`Unsupported SessionRequest '${request?.params?.request?.method}': ${JSON.stringify(request)}`);
        this.#walletKit.respondSessionRequest({
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
      await this.#walletKit.respondSessionRequest({
        topic: this.#session.topic,
        response: formatJsonRpcResult(request.id, result),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async rejectSessionRequest(request, error) {
    try {
      await this.#walletKit.respondSessionRequest({
        topic: this.#session.topic,
        response: formatJsonRpcError(request.id, error || getSdkError('USER_REJECTED')),
      });
    } catch (err) {
      console.error(err);
    }
  }

  #isSupportedProposal(proposal) {
    const eip155ChainIds = [1, 61, 56, 137, 43114, 42161, 10, 250, 8453, 146];
    try {
      const namespaces = buildApprovedNamespaces({
        proposal: proposal.params,
        supportedNamespaces: {
          eip155: {
            ...this.#SUPPORTED_NAMESPACES.eip155,
            chains: eip155ChainIds.map((item) => `eip155:${item}`),
            accounts: eip155ChainIds.map((item) => `eip155:${item}:0x0000000000000000000000000000000000000000`),
          },
        },
      });
      return Object.keys(namespaces).length !== 0;
    } catch { /* empty */ }
  }
}
