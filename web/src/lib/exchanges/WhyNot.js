import BaseExchange from './BaseExchange.js';

export default class WhyNot extends BaseExchange {
  constructor({ request, account }) {
    super({ request, account, id: 'whynot' });
  }
}
