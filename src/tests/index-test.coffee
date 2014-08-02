Index = require "../index"
#expect = require('chai').expect
util = require "util"
express = require "express"
request = require "supertest"
debug = require("debug")("react-express:tests:index-test")




describe 'Middle ware test', () ->
  before (done) ->
    app = express()
    port = 1337
    app.use Index {
      root: "./tests/react/"
    }
    app.listen(port)
    done()

  it 'Express Test', () ->
    request("http://localhost:1337/")
      .get('/asdasd/../../../../test')
      .end (err, res) ->
        debug "done"
  it 'Express Test 2', () ->
    request("http://localhost:1337/")
      .get('/')
      .end (err, res) ->
        debug "done"
