(function() {
  var Index, debug, expect, express, host, request, util;

  Index = require("../index");

  expect = require('chai').expect;

  util = require("util");

  express = require("express");

  request = require("supertest");

  debug = require("debug")("react-express:tests:index-test");

  require('node-jsx').install({
    extension: '.jsx'
  });

  host = "http://localhost:1337/";

  describe('Middle ware test', function() {
    before(function(done) {
      var app, port;
      app = express();
      port = 1337;
      app.use(Index({
        extensions: [".js", ".jsx", ".coffee", ".json"],
        basedir: "./build/tests/react/",
        debug: false
      }));
      app.listen(port);
      return done();
    });
    return it('Express Test JSX', function() {
      return request(host).get('/jsx/index?name=Neo&lol=Morp').end(function(err, res) {
        expect(res.text).to.not.equal("");
        return debug("done", res.text);
      });
    });
  });


  /*
    it 'Express Test JSX JS', () ->
      request(host)
        .get('/jsx/index.js')
        .end (err, res) ->
          expect(res.text).to.not.equal("")
          debug "done", res.text
  
  
  
  
    it 'Express Test Coffee', () ->
      request(host)
        .get('/coffee/index')
        .end (err, res) ->
          expect(res.text).to.not.equal("")
          debug "done", res.text
  
  
    it 'Express Test 3', () ->
      request(host)
        .get('/index.js')
        .end (err, res) ->
          expect(res.text).to.not.equal("")
          debug "done", res.text
    it 'Express Test Folder Constraint', () ->
      request(host)
        .get('/../outside/test')
        .end (err, res) ->
          expect(res.status).to.equal(404)
          debug "done", res.text
  
    it 'Express Test 2', () ->
      request(host)
        .get('/')
        .end (err, res) ->
          expect(res.text).to.not.equal("")
          debug "done", res.text
   */

}).call(this);
