var db = require('../db')
var assert = require('assert')

describe('db', function(){
  it('returns a database with the specified name', function(done){
    var userDB = db("_users")
    userDB.exists(function(err, exist){
      assert.equal(err, null)
      assert(exist)
      done()
    })
  })
})
