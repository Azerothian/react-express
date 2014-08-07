
browserify = require "browserify"
bgshim = require 'browserify-global-shim'
paths = require "path"
debug = require("debug")("react-express:jsrender")

module.exports = class jsrender
  constructor: (options) ->
    {
      @file,
      @output,
      @excludeReact,
      @browserifyOptions,
      @globalShim,
      @appName
    } = options

    if !@browserifyOptions?
      @browserifyOptions = {}

    @browserifyOptions.basedir = paths.dirname(@file)


    if !@file?
      throw "no file is provided"

    if !@output?
      throw "no target output is provided"

    if !@appName?
      @appName = "app"
    if !@globalShim?
      @globalShim = {}
    if @excludeReact
      @globalShim.react = 'React || React'


  render: () =>
    return new Promise (resolve, reject) =>
      globalShim = bgshim.configure @globalShim
      b = browserify(@browserifyOptions)

      b.transform globalShim, { global: true }

      if @excludeReact
        b.external("react")

      b.require(basePath, { expose: @appName })
      resolve b.bundle()

  renderFile: () =>
    return new Promise (resolve, reject) =>
      @render().then (stream) ->
        write = fs.createWriteStream(@output)
        stream.pipe(write)
        write.on "close", () ->
          debug "fin"
          resolve()
