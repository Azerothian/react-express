(function() {
  var debug, expect, express, host, reactexpress, request, util;

  express = require("express");

  reactexpress = require("../index");

  expect = require('chai').expect;

  util = require("util");

  express = require("express");

  request = require("supertest");

  debug = require("debug")("nodes:tests:index-test");

  require('node-jsx').install({
    extension: '.jsx'
  });

  host = "http://localhost:1337/";

  describe('Middleware test', function() {
    before(function(done) {
      var app, data, port;
      app = express();
      port = 1337;
      data = {
        cache: "./cache",
        basedir: "./build/tests/files/",
        routes: {
          "//index": {
            path: "./control.coffee",
            props: function(req, res, control) {
              return {};
            },
            alias: ["//"]
          },
          "/a/": {
            path: "./array/*.coffee"
          },
          "/b/": {
            path: "./**/*.coffee"
          }
        }
      };
      return reactexpress(data).then(function(middleware) {
        app.use(middleware);
        app.listen(port);
        return done();
      });
    });
    return it('Express Test', function() {
      return request(host).get('/index').end(function(err, res) {
        expect(res.text).to.not.equal("");
        return debug("done", res.text);
      });
    });
  });


  /*
  
  
      data = {
        cache: "./cache"
        basedir: "./build/tests/files/"
        routes: [{
          alias: [ "//", "index" ] # only works with component defined
          path: "./control.coffee"
          props: { name: "Tester 123" }
        }
        , {
         * // allows localhost/array/file.html
          path: "./*.coffee"
          basedir: "./tests/files/array/"
          layout: "./layout" #overrides using internal layout,
          props: (control) ->
            {}
        }
        ]
      }
   */

}).call(this);
