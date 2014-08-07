(function() {
  var Index, debug, expect, express, host, request, routerData, util;

  express = require("express");

  Index = require("../index");

  expect = require('chai').expect;

  util = require("util");

  express = require("express");

  request = require("supertest");

  debug = require("debug")("nodes:tests:index-test");

  require('node-jsx').install({
    extension: '.jsx'
  });

  host = "http://localhost:1337/";

  describe('Middle ware test', function() {
    return before(function(done) {
      var app, data, port;
      app = express();
      port = 1337;
      data = {
        output: "./cache",
        routes: [
          {
            alias: ["//index", "//"],
            component: ["./tests/files/control.coffee"]
          }, {
            files: ["./tests/files/array/*.coffee"],
            basedir: "./tests/files/",
            layout: "./tests/files/layout"
          }
        ]
      };
      app.use(Index(data));
      app.listen(port);
      return done();
    });
  });

  routerData = {
    items: [
      {
        path: ["//index", "//"],
        layout: "/files/layout.coffee",
        control: "/files/control.coffee",
        props: {
          hi: "hi"
        }
      }
    ]
  };

}).call(this);
