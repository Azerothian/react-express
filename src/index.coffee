React = require "react"
debug = require("debug")("react-express")
url = require "url"
parseurl = require "parseurl"
paths = require "path"
glob = require "glob"

{html, head,body,div, script, title} = React.DOM

renderHtml = (file, req, res, next) ->
  debug "render start"
  res.setHeader('Content-Type', 'text/html')
  cls = require(file)
  scripts = []
  if cls.getScripts?
    scripts = cls.getScripts().map (s) ->
      return script { src: s }
  components = html {},
    head {}#,
      #title {}, cls.getTitle() if cls.getTitle?
    body {},
      cls {}
      scripts
  str = React.renderComponentToStaticMarkup components
  debug "render complete", str
  res.end str

renderJs = (file, req, res, next) ->
  res.setHeader('Content-Type', 'text/javascript')
  next()

module.exports = (options) ->
  {root} = options

  return (req, res, next) ->

    return next() if 'GET' != req.method && 'HEAD' != req.method
    originalUrl = url.parse req.originalUrl || req.url
    processed = paths.normalize parseurl(req).pathname

    if paths.sep is processed
      processed = "/index"
    path = paths.join __dirname, root, processed
    debug "request", "#{path}.*"
    glob "#{path}.*", (err, files) ->
      if files.length == 0
        return next()
      fileName = files[0]
      if paths.extname(processed) is "js"
        renderJs(path, req, res, next)
      else
        renderHtml(path, req, res, next)


###
express = require "express"
app = express()
port = 1337
app.use module.exports {
  root: "./tests/react/"
}
app.listen(port)
###
