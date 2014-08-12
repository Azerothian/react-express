exports.merge = (options, overrides) ->
  extend (extend {}, options), overrides

extend = exports.extend = (object, properties) ->
  for key, val of properties
    object[key] = val
  object
