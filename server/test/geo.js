var geo = require('../geo')
var assert = require('assert')

describe('geo', function(){
  var userInfo, lat, lon

  beforeEach(function(){
    userInfo = {id: "foobar", name: "Wei Lu", email: "wei@example.com", network: "litecoin"}
    lat = 34.2308391
    lon = 108.8686767
    geo.reset()
  })

  describe('save', function(){
    it('stores geo, user id, user name, email and network', function(done){
      var geocells = [
        'd', 'da', 'da5', 'da51', 'da519', 'da519c', 'da519ce', 'da519cee',
        'da519cee5', 'da519cee57', 'da519cee570', 'da519cee5702', 'da519cee57022'
      ]

      geo.save(lat, lon, userInfo, function(){
        assert.equal(geo.all().length, 1)
        var entry = geo.all()[0]

        assert(new Date().getTime() - entry.timestamp < 100)
        delete entry.timestamp

        assert.deepEqual(entry, {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          network: userInfo.network,
          location: {lat: lat, lon: lon},
          geocells: geocells
        })

        done()
      })
    })

    it('overwrites data with the same user id', function(done){
      geo.save(lat, lon, userInfo, function(){
        geo.save(1.0, 1.0, userInfo, function(){
          assert.equal(geo.all().length, 1)
          done()
        })
      })
    })

  })

  describe('search', function(){
    it('invokes callback with records within geo.SEARCH_RADIUS', function(done){
      var userInfo1 = {id: "foo", name: "Kuba", email: "kuba@example.com", network: "litecoin"}
      var lat1 = 34.23
      var lon1 = 108.87
      // 153m from Wei

      var userInfo2 = {id: "bar", name: "Wendell", email: "wendell@example.com", network: "litecoin"}
      var lat2 = 34.22
      var lon2 = 108.87
      // 1209 from Wei

      geo.save(lat1, lon1, userInfo1, function(){
        geo.save(lat2, lon2, userInfo2, function(){
          geo.search(lat, lon, userInfo, function(err, results){
            assert.equal(results.length, 1)

            var user = results[0][0]
            var distance = results[0][1]
            assert.equal(user.id, "foo")
            assert.equal(parseInt(distance), 153)
            done()
          })
        })
      })
    })

    it('excludes search results with a different network', function(done){
      var userInfo1 = {id: "foo", name: "Kuba", email: "kuba@example.com", network: "litecoin"}
      var userInfo2 = {id: "bar", name: "Wendell", email: "wendell@example.com", network: "bitcoin"}

      geo.save(lat, lon, userInfo1, function(){
        geo.save(lat, lon, userInfo2, function(){
          geo.search(lat, lon, userInfo, function(err, results){
            assert.equal(results.length, 1)

            assert.equal(results[0][0].id, "foo")
            done()
          })
        })
      })
    })

    it('retuns users from all networks when no network is specified', function(done){
      var userInfo1 = {id: "foo", name: "Kuba", email: "kuba@example.com", network: "litecoin"}
      var userInfo2 = {id: "bar", name: "Wendell", email: "wendell@example.com", network: "bitcoin"}

      geo.save(lat, lon, userInfo1, function(){
        geo.save(lat, lon, userInfo2, function(){

          delete userInfo.network

          geo.search(lat, lon, userInfo, function(err, results){
            assert.equal(results.length, 2)

            var userIds = results.map(function(r){ return r[0].id })
            assert.deepEqual(userIds, ["foo", "bar"])
            done()
          })
        })
      })
    })
  })

  describe('remove', function(){
    it('deletes user data for the specified id', function(done){
      geo.save(lat, lon, userInfo, function(){
        assert.equal(geo.all().length, 1)

        geo.remove(userInfo.id)
        assert.equal(geo.all().length, 0)
        done()
      })
    })
  })

  describe('getIdsOlderThan', function(){
    it('finds entries older than the age(in miliseconds) provided', function(done){
      var userInfo1 = {id: "foo", name: "Kuba", email: "kuba@example.com", network: "litecoin"}
      var lat1 = 34.23
      var lon1 = 108.87

      geo.save(lat, lon, userInfo, function(){
        setTimeout(function(){
          geo.save(lat1, lon1, userInfo1, function(){
            var entries = geo.getIdsOlderThan(190)
            assert.equal(entries.length, 1)
            assert.equal(entries[0], userInfo.id)
            done()
          })
        }, 200)
      })
    })
  })
})
