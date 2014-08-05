React = require "react"
debug = require("debug")("react-express")
url = require "url"
paths = require "path"
glob = require "glob"
browserify = require "browserify"
Promise = require "bluebird"
serveStatic = require "serve-static"
mkpath = require "mkpath"
fs = require "fs"
rimraf = require "rimraf"

{html, head,body,div, script, title, link} = React.DOM

#todo
#pass get strings as properties into the react component
#show 500 error message for when rendercheck fails
class ReactExpress

  constructor: (@options = {}) ->
    if !@options.reactscript?
      @options.reactscript = "//cdnjs.cloudflare.com/ajax/libs/react/0.11.1/react.min.js"
    if !@options.cachedir?
      @options.cachedir = "react-cache"
    @rootPath = paths.join process.cwd(), @options.basedir
    @cacheDir = paths.join process.cwd(), @options.cachedir
    debug "@cacheDir", @cacheDir
    @staticCache = serveStatic(@cacheDir)
    rimraf @cacheDir, () ->



  express: (req, res, next) =>
    return next() if 'GET' != req.method && 'HEAD' != req.method
    @processPath(req, res).then (pathInfo) =>
      debug "starting rendercheck", pathInfo
      @renderCheck(pathInfo, req, res).then () =>
        debug "finished executing static cache"
        @staticCache(req,res,next)
        #nowhere
      , () ->
        debug "rendercheck failed"
        next()
    , () ->
      debug "not found"
      next()
  processPath: (req, res) =>
    return new Promise (resolve, reject) =>
      #url = url.parse req.originalUrl || req.url
      debug "start"
      uri = url.parse(req.url, true)
      #need to do better job in cleaning this
      relative = uri.pathname.replace("//", "/") #paths.normalize url.pathname
      #if paths.sep is "\\"
      #  relative = relative.replace(/\\/g, '/');

      ext = paths.extname(relative)

      relative = relative.replace(ext, "")
      debug "relate", relative
      #if relative.indexOf("\\") > -1
      relative = relative.replace("//", "")
      if "/" is relative
        relative = "/index"
      path = paths.join @rootPath, relative
      debug "processPath : relative", relative
      debug "processPath : path", path
      pathInfo = {
        url: uri,
        relative: relative,
        fullPath: path,
        ext: ext
      }

      globPath = ".#{relative}.*"
      debug "globPath", globPath, @rootPath
      glob globPath, {cwd: @rootPath}, (err, files) =>
        if err?
          debug "glob err", err
        pathInfo.files = files
        debug "files found #{files.length}", files
        if files.length > 0
          check = false

          if @options.extensions?
            for file in files
              ex = paths.extname(file)
              for e in @options.extensions
                debug " ex vs e ", ex, e ,ex is e
                if ex is e
                  check = true
                  break
              if check
                break
            if !check
              debug "invalid extension"
              return reject();
          return resolve(pathInfo)


        reject()

  renderCheck: (pathInfo, req, res) =>
    return new Promise (resolve, reject) =>
      debug "rendercheck", pathInfo
      if pathInfo.ext == ".js"
        debug "starting renderJs"
        return @renderJs(pathInfo, req, res).then resolve, reject
      debug "starting renderHtml"
      return @renderHtml(pathInfo, req, res).then resolve, reject

  renderJs: (pathInfo, req, res) =>
    return new Promise (resolve, reject) =>
      debug "renderJs"
      basePath = ".#{pathInfo.relative}"
      cacheFilePath = paths.join(@cacheDir, basePath)+ ".js"
      fs.exists cacheFilePath, (exists) =>
        if(exists)
          debug "js file exists, no need to render"
          return resolve()

        cacheFileDir = paths.dirname(cacheFilePath)


        res.setHeader('Content-Type', 'text/javascript')

        debug "basePath", basePath
        bopts = {}
        for opts of @options
          if opts != "version" && opts != "cache"
            bopts[opts] = @options[opts]
        bopts.basedir = @rootPath

        debug "start browserify", bopts

        globalShim = require('browserify-global-shim').configure {
          'react': 'React || React'
        }

        b = browserify(bopts)

        debug "creating dir", cacheFileDir
        mkpath cacheFileDir, (err) ->
          debug "cachePath", cacheFilePath
          b.transform(globalShim, {global: true})
          b.external("react")
          b.require(basePath, { expose: "app" })

          strm = b.bundle()

          write = fs.createWriteStream(cacheFilePath)

          strm.pipe(write)

          write.on "close", () ->
            debug "fin"
            resolve()
          #return resolve()


  renderHtml: (pathInfo, req, res) =>
    return new Promise (resolve, reject) =>
      debug "render html"
      res.setHeader('Content-Type', 'text/html')

      filePath = paths.normalize(pathInfo.fullPath)
      debug "require check for scripts?", filePath
      cls = require(filePath)
      cls.req = req
      cls.res = res
      scripts = [
        script { src: "#{pathInfo.relative}.js", type: "text/javascript" }
      ]
      links = []
      debug "cls.getScripts?"
      if cls.getScripts?
        scripts = scripts.concat cls.getScripts().map (s) ->
          return script { src: s, type: "text/javascript" }
      if cls.getCSS?
        links = links.concat cls.getCSS().map (c) ->
          return link {href: c, rel:"stylesheet", type:"text/css" }

      props = JSON.stringify pathInfo.url.query
      startupScript = "var app = require('app');
      var r = React;
      if(!r) {
        r = require('react');
      }
      var container = document.getElementById('react-component');
      r.renderComponent(app(#{props}), container);"


      #cls.getHeadTags() if cls.getHeadTags?
      #debug "render component html"
      try
        debug "creating component"
        component =  cls(pathInfo.url.query)
        debug "render component html", component
        compHtml = React.renderComponentToString component
      catch e
        debug "err", e
      debug "create components"
      components = html {},
        head {}#,
          title {}, cls.getTitle() if cls.getTitle?
          script { src:"#{@options.reactscript}", type:"text/javascript" }
          links
        body {},
          div {
            id: "react-component",
            dangerouslySetInnerHTML: {
              "__html": compHtml
            }
          }
          scripts
          script {
            type: "text/javascript",
            dangerouslySetInnerHTML: {
              "__html": startupScript
            }
          }
      debug "render components"
      str = React.renderComponentToStaticMarkup components
      debug "render complete", str
      res.send str

module.exports = (options) ->
  return new ReactExpress(options).express


###
url = url.parse req.originalUrl || req.url
path = paths.join __dirname, root, processed
processed = paths.normalize parseurl(req).pathname
if paths.sep is processed
  processed = "/index"
debug "processPath", url, path, processed
glob "#{path}.*", (err, files) ->
  if files.length == 0
    return next()
  fileName = files[0]

  if paths.extname(processed) is "js"
    renderJs(path,processed, req, res, next)
  else
    renderHtml(path,processed, req, res, next)



###
