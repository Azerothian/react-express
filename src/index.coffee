
jsrender = require "./jsrender"
baseLayout = require "./layout"

Promise = require "bluebird"
url = require "url"
fs = require "fs"



# todo
# create view component


class ReactExpress
  constructor: (options) ->
    {cache, @routes, @basedir} = options
    @cacheDir = paths.join process.cwd(), cache
    @staticCache = serveStatic(@cache)


  init: () =>
    return new Promise (resolve, reject) =>
      rimraf @cacheDir, () =>
        fs.mkdir @cacheDir (err) =>

          # Generate data

          promises = []

          for route in @routes
            promises.push @generateRoute route




          resolve()

  generateRoute: (route) =>
    return new Promise (resolve, reject) =>
      if route.component?
        #generate single component


  createComponent: (path, props) =>


  express: (req, res, next) =>


    @staticCache req, res, next





module.exports = ReactExpress
