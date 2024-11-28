import BaseExchange from './BaseExchange.js';

export default class ChangeNOWExchange extends BaseExchange {
  constructor({ request, account }) {
    super({ request, account, id: 'changenow', name: 'ChangeNOW' });
  }
}
