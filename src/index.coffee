
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
React = require "react"

isGlob = (str) ->
  return str.indexOf("*") > -1


# todo
# create view component


module.exports = (opts) ->
  return new Promise (resolve, reject) ->
    reactRoute = new ReactExpress()
    return reactRoute.init(opts).then () ->
      resolve(reactRoute)
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
        debug "cache directory", @cacheDir
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
          relative = paths.relative(@filesDir, file)
          debug "relative", relative
          p = paths.join @cacheDir, relative
          dir = paths.dirname(p)
          name = paths.basename(relative, paths.extname(relative))
          out = paths.join dir, "#{name}.js"
          @js[relative] = out

          promises.push jsrender(file, out, {
            basedir: @filesDir
            excludeReact: true
          })

        Promise.all(promises).then resolve, reject

  generateRoutes: () =>
    return new Promise (resolve, reject) =>
      if @options.routes?
        @routes = {}
        promises = []
        for rname of @options.routes
          promises.push @generateRouteFromRule(rname, @options.routes[rname])
        return Promise.all(promises).then resolve, reject
      return resolve()


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
            routePath = url.resolve(routeName, relative).replace(fileExt, "")
            promises.push @createRoute(routePath, relative, file, route)
          return Promise.all(promises).then resolve, reject
      else
        relativePath = paths.relative(@filesDir, controlPath)
        @createRoute(routeName,relativePath,controlPath, route)
        .then resolve, reject

  createRoute: (routePath, filePath,controlPath, route) =>
    return new Promise (resolve, reject) =>
      cleanPath = routePath.replace(/\\/g, "/")
      jsFile = @getJsFileSync(filePath)
      debug "routePath", cleanPath, jsFile
      newRoute = {
        control: controlPath
        compile: jsFile
        props: route.props if route.props?
      }

      @routes[cleanPath] = newRoute
      if route.alias?
        for a in route.alias
          @routes[a] = newRoute
      return resolve()

  getJsFileSync: (path) =>
    if !@js[path]?
      debug "file was not found ", path, @js
    rel = paths.relative(@cacheDir, @js[path]).replace(/\\/g, "/")
    return rel


  clearCache: () =>
    return new Promise (resolve, reject) =>
      rimraf @cacheDir, () =>
        fs.mkdir @cacheDir, (err) ->
          if err?
            debug "clear cache rejected"
            return reject(err)
          debug "clear cache success"
          resolve()

  router: (req, res, next) =>
    uri = url.parse req.url, true
    debug "url pathname", uri.pathname
    for route of @routes
      if "#{route}" is uri.pathname
        return @generateHtml route, @routes[route], req, res, next
    debug "forwarding to cache"
    @staticCache(req,res,next)

  generateHtml: (routeName, route, req, res, next) =>
    #return next()

    res.setHeader('Content-Type', 'text/html')
    cls = require(route.control)
    scripts = [ {src: route.compile, type: "text/javascript"} ]
    links = []
    debug "cls.getScripts?"
    if cls.getScripts?
      scripts = scripts.concat cls.getScripts()
    if cls.getCSS?
      links = links.concat cls.getCSS()

    componentProps = {}
    componentProps = route.props(req, res, cls) if route.props?

    try
      debug "creating component"
      component =  cls(componentProps)
      debug "render component html", component
      componentHtml = React.renderComponentToString component
    catch e
      debug "err", e

    p = {
      title: ""
      scripts: scripts
      links: links
      html: componentHtml
      componentProps: route.props(cls, req, res) if route.props?
    }

    layout = require("./layout")(p)
    html = React.renderComponentToStaticMarkup layout
    debug "render complete"
    res.send html





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
