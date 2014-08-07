express = require "express"


Index = require "../index"
expect = require('chai').expect
util = require "util"
express = require "express"
request = require "supertest"
debug = require("debug")("nodes:tests:index-test")
require('node-jsx').install({extension: '.jsx'})


host = "http://localhost:1337/"

describe 'Middleware test', () ->
  before (done) ->
    app = express()
    port = 1337

    data = {
      cache: "./cache"
      basedir: "./tests/files/"
      routes: [{
        name: "index"
        alias: [ "//" ] # only works with component defined
        component: "./tests/files/control.coffee"
        props: { name: "Tester 123" }
      }, {
        # // allows localhost/array/file.html
        files: ["./tests/files/array/*.coffee"]
        basedir: "./tests/files/array/"
        layout: "./tests/files/layout" #overrides using internal layout,
      }]
    }


    app.use Index data
    app.listen(port)
    done()
