react-express
=============

Express Middleware to render react components

Use at your own risk, is pretty alpha atm a bit of optimising needs to happen

## Install
```
npm install express react-express --save

```
### jsx support
```
npm install node-jsx reactify --save
```
### coffee support
```
npm install coffee-script coffeeify --save
```

## Setup

### package.json
### jsx support
```
"browserify": { "transform": [ "reactify" ] }
```
### coffee support
```
"browserify": { "transform": [ "coffeeify" ] }
```

## app.coffee
http://js2coffee.org/ <-- for js users! :D
```
reactExpress = require("react-express")
#for jsx support
require('node-jsx').install({extension: '.jsx'})
#for coffee support
require("coffee-script").register()

serveStatic = require('serve-static')

express = require "express"
app = express()
port = 1337
browserifyOptions = {
  extensions: [".js", ".json", ".jsx", ".coffee"]
  basedir: "./public/"
  debug: false # real expensive atm if true
}

app.use reactExpress(browserifyOptions)
app.use require('serve-static')("./public")
app.listen(port)
```

## TODO:
* cache in session, html files based on get string
* pass get strings as properties into the react component
* cache javascript in a global storage
* show 500 error message for when rendercheck fails
