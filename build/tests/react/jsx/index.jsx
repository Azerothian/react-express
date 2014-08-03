/**
 * @jsx React.DOM
 */

var React = require('react')
var debug = require('debug')('react-express:tests:jsx')
debug("included")
module.exports = React.createClass({
  statics: {
    getScripts: function () {
      return [
        "/js/underscore-1.5.2.js",
        "/js/backbone-1.1.0.js",
        "/js/backbone.localStorage.js"
      ]
    },
    getCSS: function () {
      return [
        "/css/reacttodos.css"
      ]
    }
  },
  getInitialState: function() {
    return {
      title: ""
    };
  },

  render: function() {
    debug("rendering element")
    return <div>Hello, {this.props.name}!</div>
  }
})
