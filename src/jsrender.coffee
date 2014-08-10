
browserify = require "browserify"
bgshim = require 'browserify-global-shim'
debug = require("debug")("react-express:jsrender")
fs = require "fs"
Promise = require "bluebird"
mkdirp = require "mkdirp"
paths = require "path"



module.exports = (src, target, options) ->
  return new Promise (resolve, reject) ->
    #todo check if file exists and reject if it does
    debug "jsrender", target
    #return resolve()
    if !src?
      return reject("no file is provided")
    if !target?
      return reject("no target is provided")

    {
      basedir,
      excludeReact,
      browserifyOptions,
      globalShim,
      appName
    } = options

    #defaults
    if !basedir?
      basedir = process.cwd()

    if !browserifyOptions?
      browserifyOptions = {}
    browserifyOptions.basedir = basedir
    if !appName?
      appName = "app"
    if !globalShim?
      globalShim = {}

    b = browserify(browserifyOptions)
    if excludeReact
      debug "excluding react"
      globalShim.react = 'React || React'
      globalShim = bgshim.configure globalShim
      b.transform globalShim, { global: true }
      b.external("react")

    b.require(src, { expose: appName })

    stream = b.bundle()

    mkdirp paths.dirname(target), (err) ->
      write = fs.createWriteStream(target)
      stream.pipe(write)
      write.on "close", () ->
        debug "fin"
        resolve()
