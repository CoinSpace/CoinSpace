import BaseExchange from './BaseExchange.js';

export default class ChangellyExchange extends BaseExchange {
  constructor({ request, account }) {
    super({ request, account, id: 'changelly', name: 'Changelly' });
  }
}
