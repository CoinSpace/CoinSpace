var auth = require('../auth')
var assert = require('assert')
var db = require('../db')
var userDB = db('_users')

describe('auth', function(){

  describe('exist', function(){
    var name = "foobar"
    var nameInDB = "org.couchdb.user:" + name

    it('true if user exists', function(done){
      auth.register(name, 1111, '', '', function(){
        auth.exist(name, function(err, exist){
          assert(exist)
          userDB.remove(name, function(err, res){})
          done()
        })
      })
    })

    it('false if user does not exist', function(done){
      userDB.get(nameInDB, function (err, user) {
        if(err && err.error === 'not_found'){
          runTest()
        }else {
          userDB.remove(user._id, user._rev, function(err, res){
            assert(!err)
            runTest()
          })
        }
      })

      function runTest(){
        auth.exist(name, function(err, exist){
          assert(!exist)
          done()
        })
      }
    })
  })

  describe('disablePin', function(){
    var name = "foobardisablepin"
    var nameInDB = "org.couchdb.user:" + name

    beforeEach(function(done){
      removeUser(function(){
        auth.register(name, 1111, '', '', done)
      })
    })

    afterEach(removeUser)

    function removeUser(done){
      userDB.get(nameInDB, function (err, user) {
        if(err) return done();
        userDB.remove(user._id, user._rev, function(err, res){
          done()
        })
      })
    }

    it('returns error when pin verification fails', function(done){
      var pin = 2222
      auth.disablePin(name, pin, function(err){
        assert.equal(err.error, "disable_pin_failed")
        done()
      })
    })

    it('returns error when user does not exist', function(done){
      var pin = 1111
      auth.disablePin(name + 'a', pin, function(err){
        assert.equal(err.error, "disable_pin_failed")
        done()
      })
    })

    it('upon success allows sign in without a pin', function(done){
      var pin = 1111
      auth.disablePin(name, pin, function(err){
        assert.equal(err, null)

        auth.login(name, undefined, function(err, token){
          assert.equal(err, null)
          assert(token)
          done()
        })
      })
    })
  })
})
