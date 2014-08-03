require('node-jsx').install({extension: '.jsx'})
require('coffee-script').register()
debug = require("debug")("react-express:tests:standalone")
express = require "express"
app = express()
port = 1337

app.use require("../index")({
  extensions: [".js", ".jsx", ".coffee", ".json"]
  basedir: "./react/"
  debug: false # real expensive atm if true
})
app.listen(port)
