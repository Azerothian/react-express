
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

isGlob = (str) ->
  return str.indexOf("*") > -1

# todo
# create view component


module.exports = (opts) ->
  return new Promise (resolve, reject) ->
    reactRoute = new ReactExpress()
    return reactRoute.init(opts).then () ->
      resolve(reactRoute.express)
    , reject

class ReactExpress
  init: (@options) =>
    return new Promise (resolve, reject) =>
      @cacheDir = paths.join process.cwd(), @options.cache
      @filesDir = paths.join process.cwd(), @options.basedir
      Promise.resolve()
      .then @clearCache
      .then @generateJavascript
      .then @generateRoutes
      .then () =>
        @staticCache = serveStatic(@cacheDir)
        resolve()
      , reject


  generateJavascript: () =>
    return new Promise (resolve, reject) =>

      @js = {}

      globPath = "#{@filesDir}/**/*.*"

      glob globPath, (err, files) =>
        if err?
          debug "generateJavascript: glob failed", err, globPath
          return reject(err)

        promises = []
        debug "@filesDir", @filesDir
        for file in files
          #paths paths.resolve(file) to make replace work on win32


#
#          cleanFile = paths.resolve(file)
#          dirName = paths.dirname(cleanFile)
#          dir = paths.relative(@filesDir, dirName)
#          debug "dirname", dirName
#
#          fileCacheDir = paths.join @cacheDir, dir
#          name = paths.basename(cleanFile, paths.extname(cleanFile))
#          out = "#{fileCacheDir}#{paths.sep}#{name}.js"

          relative = paths.relative(@filesDir, file)
          debug "relative", relative
          p = paths.join @cacheDir, relative
          dir = paths.dirname(p)
          name = paths.basename(relative, paths.extname(relative))
          out = paths.join dir, "#{name}.js"

          @js[relative] = out

          promises.push jsrender(file, out, {
            basedir: @filesDir,
            excludeReact: true
          })

        Promise.all(promises).then resolve, reject

  generateRoutes: () =>
    return new Promise (resolve, reject) =>
      @routes = {}
      promises = []
      for rname of @options.routes
        promises.push @generateRouteFromRule(rname, @options.routes[rname])
      Promise.all(promises).then resolve, reject


  generateRouteFromRule: (routeName, route) =>
    return new Promise (resolve, reject) =>
      controlPath = paths.join @filesDir, route.path
      if isGlob(controlPath)
        promises = []
        glob controlPath, (err, files) =>
          if err?
            debug "generateRouteFromRule glob err", err, controlPath
            return reject(err)
          for file in files
            fileExt = paths.extname(file)
            relative = paths.relative(@filesDir, file)
            routePath = url.resolve(routeName, relative)
            promises.push @createRoute(routePath.replace(fileExt, ""), route, relative)
          return Promise.all(promises).then resolve, reject
      else
        relativePath = paths.relative(@filesDir, controlPath)
        @createRoute(routeName, route, relativePath)
        .then resolve, reject

  createRoute: (routePath, route, filePath) =>
    return new Promise (resolve, reject) =>
      jsFile = @getJsFileSync(filePath)
      debug "routePath", routePath, jsFile
      return resolve()

  getJsFileSync: (path) =>
    if !@js[path]?
      debug "file was not found ", path, @js
    return @js[path]


  clearCache: () =>
    return new Promise (resolve, reject) =>
      rimraf @cacheDir, () =>
        fs.mkdir @cacheDir, (err) ->
          if err?
            debug "clear cache rejected"
            return reject(err)
          debug "clear cache success"
          resolve()

  express: (req, res, next) =>
    uri = url.parse(req.url, true)
    for route in @routes
      if route is uri.pathname
        debug "route to render html"
        return next()
    @staticCache(res,res,next)








###
class ReactExpress
  init: (@options) =>
    return new Promise (resolve, reject) =>
      @routes = {}
      @cacheDir = paths.join process.cwd(), @options.cache
      debug "cacheDir #{@cacheDir}"
      @staticCache = serveStatic(@cacheDir)
      debug "rimraf"
      rimraf @cacheDir, () =>
        debug "mkdir"
        fs.mkdir @cacheDir, (err) =>
          # Generate data
          debug "gen routes", @routes
          promises = []
          for route of @options.routes
            debug "routes", route
            promises.push @generateRoute route, @options.routes[route]
          Promise.all(promises).then () =>
            debug "routes generated", @routes
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


  createComponent: (uri, controlPath, routeData) =>
    return new Promise (resolve, reject) =>
      cachePath = paths.join @cacheDir, uri
      route = {
        uri: uri
        controlPath: controlPath
        jsFile: "#{cachePath}.js"
      }
      if routeData.alias?
        for a in route.alias
          @routes[a] = component
      @routes[uri] = component
      resolve()

  express: (req, res, next) =>
    @staticCache req, res, next
###
