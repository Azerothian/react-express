/**
 * @jsx React.DOM
 */

var React = require('react')
var debug = require('debug')('react-express:tests:jsx')
debug("included")
module.exports  = React.createClass({

  render: function() {
    debug("rendering element")
    return <div>Hello, {this.props.name}!</div>
  }
})
