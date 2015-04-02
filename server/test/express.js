var request = require('supertest')
var proxyquire =  require('proxyquire')
var assert = require('assert')

var token = 'sometoken'
var fakeAuth = {
  register: function(name, pin, phone, passphrase, callback){
    if(name === 'valid') {
      callback(null, token)
    } else {
      callback(new Error('boo'), null)
    }
  },
  login: function(name, pin, callback) {
    callback(null, token)
  },
  exist: function(name, callback){
    callback(null, 'yay!')
  },
  disablePin: function(name, pin, callback) {
    if(pin === '1234') {
      callback(null)
    } else {
      callback(new Error('disable pin failed'))
    }
  }
}

var user1 = {id: "foo", name: "Kuba", email: "kuba@example.com"}
var user2 = {id: "bar", name: "Wendell", email: "wendell@example.com"}
var geoRes = [[user1, 50], [user2, 123]]
var fakeGeo = {
  save: function(lat, lon, userInfo, callback){
    if(userInfo.id && userInfo.name !== 'Fail Me') {
      callback(null)
    } else {
      callback(new Error('save error'), null)
    }
  },
  search: function(lat, lon, userInfo, callback){
    if(userInfo.id && userInfo.name !== 'Fail Me') {
      callback(null, geoRes)
    } else {
      callback(new Error('search error'), null)
    }
  }
}
var app = proxyquire('../express', {
  './auth': fakeAuth,
  './geo': fakeGeo
})()

describe('POST /register', function(){

  // TODO: clean db & setup db
  // beforeEach(function(){
  // })

  it('sets user session on auth.register success', function(done){
    request(app)
      .post('/register')
      .send({wallet_id: 'valid', pin: '1234', phone: '', passphrase: ''})
      .end(function(err, res){
        assert.equal(res.status, 200)
        assert.deepEqual(res.text, token)
        assert(res.headers['set-cookie'])
        done()
      })
  })

  it('returns bad request when register returns error', function(done){
    request(app)
      .post('/register')
      .send({wallet_id: 'invalid', pin: '1234'})
      .expect(400)
      .end(done)
  })

  it('returns bad request when wallet id is missing', function(done){
    request(app)
      .post('/register')
      .send({pin: '1234'})
      .expect(400)
      .end(done)
  })

  it('returns bad request when pin is missing', function(done){
    request(app)
      .post('/register')
      .send({wallet_id: 'valid'})
      .expect(400)
      .end(done)
  })

  it('returns bad request when pin is invalid', function(done){
    request(app)
      .post('/register')
      .send({wallet_id: 'valid', pin: 'www'})
      .expect(400)
      .end(done)
  })
})

describe('POST /login', function(){
  it('sets user session on successful login', function(done){
    request(app)
      .post('/login')
      .send({wallet_id: 'valid', pin: '1234'})
      .end(function(err, res){
        assert.equal(res.status, 200)
        assert.deepEqual(res.text, token)
        assert(res.headers['set-cookie'])
        done()
      })
  })
})

describe('GET /exist', function(){
  it('returns the result of auth.exist', function(done){
    request(app)
      .get('/exist?wallet_id=there')
      .end(function(err, res){
        assert.equal(res.status, 200)
        assert.deepEqual(res.text, 'yay!')
        done()
      })
  })

  it('returns bad request when wallet id is missing', function(done){
    request(app)
      .get('/exist')
      .expect(400)
      .end(done)
  })
})

describe('DELETE /pin', function(){
  it('returns ok on auth.disablePin success', function(done){
    var data = { id: "valid", pin: '1234' }
    deleteWithCookie('/pin', data, function(err, res){
      assert.equal(res.status, 200)
      done()
    })
  })

  it('returns 400 on auth.disablePin failure', function(done){
    var data = { id: "valid", pin: '1337' }
    deleteWithCookie('/pin', data, function(err, res){
      assert.equal(res.status, 400)
      done()
    })
  })

  it('returns unauthorized if session cookie is not found', function(done){
    var data = { id: "valid", pin: '1234' }

    request(app)
      .delete('/pin')
      .send(data)
      .expect(401)
      .end(done)
  })

  it('returns unauthorized if session cookie does not match the specified id', function(done){
    var data = { id: "doesnotmatch", pin: '1234' }

    deleteWithCookie('/pin', data, function(err, res){
      assert.equal(res.status, 401)
      done()
    })
  })

  function deleteWithCookie(endpoint, data, callback){
    request(app)
      .post('/login')
      .send({wallet_id: 'valid', pin: '1234'})
      .end(function(err, res){
        request(app)
          .delete(endpoint)
          .set('cookie', res.headers['set-cookie'])
          .send(data)
          .end(callback)
      })
  }
})

describe('POST /location', function(){
  function post(endpoint, data, cookie, callback){
    request(app)
      .post(endpoint)
      .set('cookie', cookie)
      .send(data)
      .end(callback)
  }

  it('returns ok on geo.save success', function(done){
    var data = {
      lat: 123.4,
      lon: 45.6,
      name: "Wei Lu",
      email: "wei@example.com"
    }
    post('/location', data, null, function(err, res){
      assert.equal(res.status, 201)
      assert(res.headers['set-cookie'])
      done()
    })
  })

  it('does not regenerate id when there is already one', function(done){
    var data = { lat: 123.4, lon: 45.6 }
    post('/location', data, null, function(err, res){
      assert.equal(res.status, 201)
      post('/location', data, res.headers['set-cookie'], function(err, res){
        assert.equal(res.status, 201)
        assert.deepEqual(res.headers['set-cookie'], undefined)
        done()
      })
    })
  })

  it('returns vad request on geo.save error', function(done){
    var data = { name: 'Fail Me' }

    post('/location', data, null, function(err, res){
      assert.equal(res.status, 400)
      done()
    })
  })
})

describe('PUT /location', function(){
  function put(endpoint, data, cookie, callback){
    request(app)
      .put(endpoint)
      .set('cookie', cookie)
      .send(data)
      .end(callback)
  }

  it('returns ok on geo.search success', function(done){
    var data = {
      lat: 123.4,
      lon: 45.6,
      name: "Wei Lu",
      email: "wei@example.com"
    }
    put('/location', data, null, function(err, res){
      assert.equal(res.status, 200)
      assert.deepEqual(JSON.parse(res.text), geoRes)
      assert(res.headers['set-cookie'])
      done()
    })
  })

  it('does not regenerate id when there is already one', function(done){
    var data = { lat: 123.4, lon: 45.6 }
    put('/location', data, null, function(err, res){
      assert.equal(res.status, 200)
      put('/location', data, res.headers['set-cookie'], function(err, res){
        assert.equal(res.status, 200)
        assert.deepEqual(res.headers['set-cookie'], undefined)
        done()
      })
    })
  })

  it('returns vad request on geo.search error', function(done){
    var data = { name: 'Fail Me' }

    put('/location', data, null, function(err, res){
      assert.equal(res.status, 400)
      done()
    })
  })
})

describe('DELETE /location', function(){
  it('returns ok', function(done){
    deleteWithCookie('/location', function(err, res){
      assert.equal(res.status, 200)
      done()
    })
  })

  function deleteWithCookie(endpoint, callback){
    var data = {
      lat: 123.4,
      lon: 45.6,
      name: "Wei Lu",
      email: "wei@example.com"
    }
    request(app)
      .post('/location')
      .send(data)
      .end(function(err, res){
        request(app)
          .delete(endpoint)
          .set('cookie', res.headers['set-cookie'])
          .end(callback)
      })
  }
})


