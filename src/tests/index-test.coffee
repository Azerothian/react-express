express = require "express"
reactexpress = require "../index"
expect = require('chai').expect
util = require "util"
request = require "supertest"
debug = require("debug")("react-express:tests:index-test")


host = "http://localhost:1337/"

describe 'Middleware test', () ->
  before (done) ->
    app = express()
    port = 1337

    data = {
      cache: "./cache"
      basedir: "./build/tests/files/"
      routes:
        "/index":
          path: "./control.coffee"
          props: (req, res, control) ->
            {
              hi: "hi"
              name: "cowboy"
            }
          #layout: "./layout.coffee"
          alias: ["/"]
        "/a/":
          path: "./array/*.coffee"
        "/b/":
          path: "./**/*.coffee"
    }

    reactexpress(data).then (middleware) ->
      app.use middleware
      app.listen(port)
      done()

  it 'Express Test', () ->
    request(host)
      .get('/index')
      .end (err, res) ->
        expect(res.text).to.not.equal("")
        debug "done", res.text
###


    data = {
      cache: "./cache"
      basedir: "./build/tests/files/"
      routes: [{
        alias: [ "//", "index" ] # only works with component defined
        path: "./control.coffee"
        props: { name: "Tester 123" }
      }
      , {
      # // allows localhost/array/file.html
        path: "./*.coffee"
        basedir: "./tests/files/array/"
        layout: "./layout" #overrides using internal layout,
        props: (control) ->
          {}
      }
      ]
    }
###
