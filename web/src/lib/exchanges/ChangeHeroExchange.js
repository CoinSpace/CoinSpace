import BaseExchange from './BaseExchange.js';

export default class ChangeHeroExchange extends BaseExchange {
  constructor({ request, account }) {
    super({ request, account, id: 'changehero' });
  }
}
