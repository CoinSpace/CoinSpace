/* global expect */
import Wallet from '@coinspace/cs-wallet';
import validateSend from '../validator';
import sinon from 'sinon';

describe('validate', ()=> {
  const wallet = new Wallet();
  wallet.networkName = 'testnet';
  const to = 'toaddress';
  const amount = 0.000123;

  afterEach(() => {
    Wallet.prototype.createTx.restore();
  });

  describe('address', ()=> {
    beforeEach(() => {
      sinon.stub(Wallet.prototype, 'createTx').throws(new Error('Invalid address'));
    });

    it('catches invalid address', (done)=> {
      validateSend(wallet, to, amount, (err)=> {
        expect(err.message).toEqual('Please enter a valid address to send to');
        done();
      });
    });
  });

  describe('send amount not above dust threshold', ()=> {
    beforeEach(() => {
      sinon.stub(Wallet.prototype, 'createTx').throws(new Error('Invalid value'));
    });

    it('works', (done)=> {
      validateSend(wallet, to, amount, (err)=> {
        expect(err.message).toEqual('Please enter an amount above');
        done();
      });
    });
  });

  describe('insufficient funds', ()=> {
    function insufficientFundsError() {
      const error = new Error('Insufficient funds');
      error.needed = 13300;
      error.has = 12300;
      return error;
    }

    describe('when it is well over wallet balance', ()=> {
      beforeEach(() => {
        sinon.stub(Wallet.prototype, 'createTx').throws(insufficientFundsError());
        sinon.stub(Wallet.prototype, 'getBalance').returns(10000);
      });

      it('produces an appropriate error message', (done)=> {
        validateSend(wallet, to, amount, (err)=> {
          expect(err.message).toEqual('You do not have enough funds in your wallet (incl. fee)');
          done();
        });
      });

      afterEach(()=> { Wallet.prototype.getBalance.restore(); });
    });

    describe('when user attempts to empty wallet without including fee', ()=> {
      beforeEach(() => {
        sinon.stub(Wallet.prototype, 'createTx').throws(insufficientFundsError());
        sinon.stub(Wallet.prototype, 'getBalance').returns(12300);
      });
      // eslint-disable-next-line max-len
      const sendableAmountMessage = 'It seems like you are trying to empty your wallet. Taking transaction fee into account, we estimated that the max amount you can send is. We have amended the value in the amount field for you';

      it('produces an appropriate error message', (done)=> {
        validateSend(wallet, to, amount, (err)=> {
          expect(err.message).toEqual(sendableAmountMessage);
          expect(err.interpolations.sendableBalance).toEqual(0.000113);
          done();
        });
      });

      afterEach(()=> { Wallet.prototype.getBalance.restore(); });
    });

    describe('when pending balance is sufficient to cover the transaction', ()=> {
      beforeEach(() => {
        const error = insufficientFundsError();
        error.details = 'Additional funds confirmation pending';
        sinon.stub(Wallet.prototype, 'createTx').throws(error);
      });
      // eslint-disable-next-line max-len
      const fundsUnavailableMessage = 'Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first.';

      it('produces an appropriate error message', (done)=> {
        validateSend(wallet, to, amount, (err)=> {
          expect(err.message).toEqual(fundsUnavailableMessage);
          done();
        });
      });
    });
  });
});
