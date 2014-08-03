React = require "react"
debug = require("debug")("react-express")
url = require "url"
parseurl = require "parseurl"
paths = require "path"
glob = require "glob"
browserify = require "browserify"
literalify = require "literalify"
Promise = require "bluebird"

{html, head,body,div, script, title, link} = React.DOM

#todo
#cache in session, html files based on get string
#pass get strings as properties into the react component
#cache javascript in a global object
#show 500 error message for when rendercheck fails
class ReactExpress

  constructor: (@browserify) ->
    @rootPath = paths.join process.cwd(), @browserify.basedir

  express: (req, res, next) =>
    return next() if 'GET' != req.method && 'HEAD' != req.method
    @processPath(req, res).then (pathInfo) =>
      debug "starting rendercheck", pathInfo
      @renderCheck(pathInfo, req, res).then () ->
        debug "finished"
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
      url = parseurl(req)
      #need to do better job in cleaning this
      relative = url.pathname.replace("//", "/") #paths.normalize url.pathname
      #if paths.sep is "\\"
      #  relative = relative.replace(/\\/g, '/');

      ext = paths.extname(relative)
      relative = relative.replace(ext, "")
      debug "relate", relative,
      #if relative.indexOf("\\") > -1
      relative = relative.replace("//", "")
      if "/" is relative
        relative = "/index"
      path = paths.join @rootPath, relative
      debug "processPath : relative", relative
      debug "processPath : path", path
      pathInfo = {
        relative: relative,
        fullPath: path,
        ext: ext
      }
      globPath = ".#{relative}.*"
      debug "globPath", globPath, @rootPath
      glob globPath, {cwd: @rootPath}, (err, files) ->
        if err?
          debug "glob err", err

        debug "files found #{files.length}", files
        if files.length > 0
          pathInfo.files = files
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
      res.setHeader('Content-Type', 'text/javascript')
      basePath = ".#{pathInfo.relative}"
      debug "basePath", basePath
      bopts = {}
      for opts of @browserify
        bopts[opts] = @browserify[opts]
      bopts.basedir = @rootPath

      debug "start browserify", bopts
      b = browserify(bopts)
        # dont know why this does not work?
        # i put it before n after require still dont work
        # .transform(literalify.configure({"react": 'window.React'}))
        .require(basePath, { expose: "app" })
        .require("react")
        .bundle()
        .pipe(res)
      debug "done?"

  renderHtml: (pathInfo, req, res) =>
    return new Promise (resolve, reject) =>
      debug "render html"
      res.setHeader('Content-Type', 'text/html')

      filePath = paths.normalize(pathInfo.fullPath)
      debug "require check for scripts?", filePath
      cls = require(filePath)
      scripts = [

        script { src: "#{pathInfo.relative}.js", type: "text/javascript" }
        #script { src: "/app.js", type: "text/javascript" }
      ]
      links = []
      debug "cls.getScripts?"
      if cls.getScripts?
        scripts = scripts.concat cls.getScripts().map (s) ->
          return script { src: s, type: "text/javascript" }
      if cls.getCSS?
        links = links.concat cls.getCSS().map (c) ->
          return link {href: c, rel:"stylesheet", type:"text/css" }


      startupScript = "var app = require('app'), React = require('react');
      var container = document.getElementById('react-component');
      React.renderComponent(app({}), container);"

      #script { src:"//cdnjs.cloudflare.com/ajax/libs/react/0.11.0/react.js", type:"text/javascript" }
      #cls.getHeadTags() if cls.getHeadTags?
      debug "render component html"
      compHtml = React.renderComponentToString cls({})
      debug "create components"
      components = html {},
        head {}#,
          title {}, cls.getTitle() if cls.getTitle?
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
