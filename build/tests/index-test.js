(function() {
  var Index, debug, express, request, util;

  Index = require("../index");

  util = require("util");

  express = require("express");

  request = require("supertest");

  debug = require("debug")("react-express:tests:index-test");

  describe('Middle ware test', function() {
    before(function(done) {
      var app, port;
      app = express();
      port = 1337;
      app.use(Index({
        root: "./tests/react/"
      }));
      app.listen(port);
      return done();
    });
    it('Express Test', function() {
      return request("http://localhost:1337/").get('/asdasd/../../../../test').end(function(err, res) {
        return debug("done");
      });
    });
    return it('Express Test 2', function() {
      return request("http://localhost:1337/").get('/').end(function(err, res) {
        return debug("done");
      });
    });
  });

}).call(this);
