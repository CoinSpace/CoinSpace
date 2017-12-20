var Wallet = require('cs-wallet')
var validateSend = require('../validator')
var sinon = require('sinon')

describe('validate', function(){
  var wallet = new Wallet()
  wallet.networkName = 'testnet'
  var to = 'toaddress'
  var amount = 0.000123

  afterEach(function() {
    Wallet.prototype.createTx.restore()
  })

  describe('address', function(){
    beforeEach(function() {
      sinon.stub(Wallet.prototype, "createTx").throws(new Error('Invalid address'))
    })

    it('catches invalid address', function(done){
      validateSend(wallet, to, amount, function(err){
        expect(err.message).toEqual('Please enter a valid address to send to')
        done()
      })
    })
  })

  describe('send amount not above dust threshold', function(){
    beforeEach(function() {
      sinon.stub(Wallet.prototype, "createTx").throws(new Error('Invalid value'))
    })

    it('works', function(done){
      validateSend(wallet, to, amount, function(err){
        expect(err.message).toEqual('Please enter an amount above')
        done()
      })
    })
  })

  describe('insufficient funds', function(){
    function insufficientFundsError() {
      var error = new Error('Insufficient funds')
      error.needed = 13300
      error.has = 12300
      return error
    }

    describe('when it is well over wallet balance', function(){
      beforeEach(function() {
        sinon.stub(Wallet.prototype, "createTx").throws(insufficientFundsError())
        sinon.stub(Wallet.prototype, "getBalance").returns(10000)
      })

      it('produces an appropriate error message', function(done){
        validateSend(wallet, to, amount, function(err){
          expect(err.message).toEqual('You do not have enough funds in your wallet (incl. fee)')
          done()
        })
      })

      afterEach(function(){ Wallet.prototype.getBalance.restore() })
    })

    describe('when user attempts to empty wallet without including fee', function(){
      beforeEach(function() {
        sinon.stub(Wallet.prototype, "createTx").throws(insufficientFundsError())
        sinon.stub(Wallet.prototype, "getBalance").returns(12300)
      })
      var sendableAmountMessage = "It seems like you are trying to empty your wallet. Taking transaction fee into account, we estimated that the max amount you can send is. We have amended the value in the amount field for you"

      it('produces an appropriate error message', function(done){
        validateSend(wallet, to, amount, function(err){
          expect(err.message).toEqual(sendableAmountMessage)
          expect(err.interpolations.sendableBalance).toEqual(0.000113)
          done()
        })
      })

      afterEach(function(){ Wallet.prototype.getBalance.restore() })
    })

    describe('when pending balance is sufficient to cover the transaction', function(){
      beforeEach(function() {
        var error = insufficientFundsError()
        error.details = "Additional funds confirmation pending"
        sinon.stub(Wallet.prototype, "createTx").throws(error)
      })
      var fundsUnavailableMessage = "Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first."

      it('produces an appropriate error message', function(done){
        validateSend(wallet, to, amount, function(err){
          expect(err.message).toEqual(fundsUnavailableMessage)
          done()
        })
      })
    })
  })
})
