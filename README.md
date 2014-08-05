react-express
=============

Express Middleware to render the html and javascript for react components

Use at your own risk, is pretty alpha atm a bit of optimising needs to happen

- GET Request params passed as properties to the react control
- Uses browserify to autogenerate the client side version of the page
- Able to use any langauge that is supported by nodejs require and browserify tranforms via package.json/options config

## Todo App
https://github.com/Azerothian/react-todo-express

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
[http://js2coffee.org/ <-- for js users! :D](http://js2coffee.org/)
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
## API

### Options
the options passed to the constructor is also passed to browserify for js compiling
- reactscript: Path to react script for the browser defaults to //cdnjs.cloudflare.com/ajax/libs/react/0.11.1/react.min.js
- cachedir: location for compile javascript files
- extensions: extensions for browserify to look for
- basedir: path to the directory where you have your files
- debug: generates sourcemaps in browserify


## TODO:
* show 500 error message for when rendercheck fails
- add options to ignore directories
