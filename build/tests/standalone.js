(function() {
  var app, data, debug, express, host, port, reactexpress, request, util;

  express = require("express");

  reactexpress = require("../index");

  util = require("util");

  request = require("supertest");

  debug = require("debug")("react-express:tests:index-test");

  require("coffee-script").register();

  require('node-jsx').install({
    extension: '.jsx'
  });

  host = "http://localhost:1337/";

  app = express();

  port = 1337;

  data = {
    cache: "./cache",
    basedir: "./files/",
    routes: {
      "/index": {
        path: "./control.coffee",
        props: function(req, res, control) {
          return {
            name: "cowboy"
          };
        },
        alias: ["/"]
      },
      "/": {
        path: "./**/*.*",
        props: function(req, res, control) {
          var name;
          if (control.getName != null) {
            name = control.getName();
          } else {
            name = "not found";
          }
          return {
            name: name
          };
        }
      }
    }
  };

  reactexpress(data).then(function(middleware) {
    app.use(middleware);
    return app.listen(port);
  });

}).call(this);
