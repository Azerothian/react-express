
jsrender = require "./jsrender"
baseLayout = require "./layout"

Promise = require "bluebird"
url = require "url"
fs = require "fs"
paths = require "path"
debug = require("debug")("react-express:index")
serveStatic = require "serve-static"
rimraf = require "rimraf"
glob = require "glob"

# todo
# create view component


module.exports = (opts) ->
  return new Promise (resolve, reject) ->
    reactRoute = new ReactExpress()
    return reactRoute.init(opts).then () ->
      resolve(reactRoute.express)
    , reject

class ReactExpress
  init: (options) =>
    return new Promise (resolve, reject) =>
      {cache, @routes, @basedir} = options
      @components = {}
      @cacheDir = paths.join process.cwd(), cache
      debug "cacheDir #{@cacheDir}"
      @staticCache = serveStatic(@cacheDir)
      debug "rimraf"
      rimraf @cacheDir, () =>
        debug "mkdir"
        fs.mkdir @cacheDir, (err) =>
          # Generate data
          debug "gen routes", @routes
          promises = []
          for route of @routes
            debug "routes", route
            promises.push @generateRoute route, @routes[route]
          Promise.all(promises).then () =>
            debug "routes generated", @components
            resolve()

  isGlob: (str) ->
    return str.indexOf("*") > -1

  generateRoute: (routePath, route) =>
    return new Promise (resolve, reject) =>
      basePath = paths.join process.cwd(), route.basedir || @basedir
      controlPath = paths.join basePath, route.path

      #.replace(new RegExp('\\' + path.sep, 'g'), '/');
      if @isGlob(controlPath)
        glob controlPath, (err, files) =>
          promises = []
          for file in files
            dir = paths.dirname(file.replace(basePath, ""))
            fileName = paths.basename file, paths.extname(file)
            uri = paths.resolve routePath, dir, fileName# "#{routePath}#{p}/#{fileName}"
            promises.push @createComponent uri, file, route
          Promise.all(promises).then resolve, reject
      else
        @createComponent(routePath, controlPath, route).then resolve, reject


  createComponent: (uri, controlPath, route) =>
    return new Promise (resolve, reject) =>
      cachePath = paths.join @cacheDir, uri
      component = {
        uri: uri
        controlPath: controlPath
        jsFile: "#{cachePath}.js"
      }
      if route.alias?
        for a in route.alias
          @components[a] = component
      @components[uri] = component
      resolve()

  express: (req, res, next) =>
    @staticCache req, res, next
