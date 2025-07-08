import BaseExchange from './BaseExchange.js';

export default class LetsExchange extends BaseExchange {
  constructor({ request, account }) {
    super({ request, account, id: 'letsexchange' });
  }
}
