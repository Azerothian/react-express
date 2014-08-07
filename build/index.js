(function() {
  var Promise, ReactExpress, baseLayout, dir, jsrender, url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  jsrender = require("./jsrender");

  baseLayout = require("./layout");

  Promise = require("bluebird");

  url = require("url");

  dir = process.cwd();

  ReactExpress = (function() {
    function ReactExpress(options) {
      this.express = __bind(this.express, this);
    }

    ReactExpress.prototype.express = function(req, res, next) {};

    return ReactExpress;

  })();

  module.exports = function(express, options) {
    return new ReactExpress(express, options).express;
  };

}).call(this);
