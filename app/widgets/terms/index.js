'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var $ = require('browserify-zepto')

module.exports = function(el){
    var ractive = new Ractive({
        el: el,
        template: require('./index.ract').template
    })

    ractive.on('back', function(e){
        setTimeout(function(){
            $("#terms").addClass('closed')
            $("#sidebar").addClass('open')
        }, 0)

        setTimeout(function(){
            $("#terms").hide()
            $("#main").show()
        }, 300)
    })

    return ractive
}
