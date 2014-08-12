helper = require "./helper"

serveStatic = require "serve-static"
Promise = require "bluebird"

defaultOptions = {
  doctype: '<!DOCTYPE html>'
  viewdir: "./views"
  cache: "./cache"
  prefixpath: "react/"
}



class ViewEngine

  constructor: (options) ->
    @opts = helper.merge defaultOptions, options


  generateJavascript: () =>
    return new Promise (resolve, reject) =>


  renderFile: (filename, options, cb) =>



module.exports = (options) ->
  return new Promise (resolve, reject) ->
    viewEngine = new ViewEngine(options)
