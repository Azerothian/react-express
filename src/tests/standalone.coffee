express = require "express"
reactexpress = require "../index"
util = require "util"
request = require "supertest"
debug = require("debug")("react-express:tests:index-test")
require("coffee-script").register()
require('node-jsx').install({extension: '.jsx'})


host = "http://localhost:1337/"

app = express()
port = 1337

data = {
  cache: "./cache"
  basedir: "./files/"
  routes:
    "/index":
      path: "./control.coffee"
      props: (req, res, control) ->
        {
          name: "cowboy"
        }
      #layout: "./layout.coffee"
      alias: ["/"]
    "/":
      path: "./**/*.*",
      props: (req, res, control) ->
        #debug "CONTROLS", control
        if control.getName?
          name = control.getName()
        else
          name = "not found"
        {
          name: name
        }
}

reactexpress(data).then (rex) ->
  app.use rex.router
  app.listen(port)
