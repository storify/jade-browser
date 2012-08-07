function Expose(){}

Expose.prototype = {
  
  expose: function(obj, namespace, name){
    var app = this.app || this;

    app._exposed = app._exposed || {};

    // support second arg as name
    // when a string or function is given
    if ('string' == typeof obj || 'function' == typeof obj) {
      name = namespace || name;
    } else {
      name = name || name;
      namespace = namespace || namespace;
    }

    // buffer string
    if ('string' == typeof obj) {
      this.js = this.js || {};
      var buf = this.js[name] = this.js[name] || [];
      buf.push(obj);
    // buffer function
    } else if ('function' == typeof obj && obj.name) {
      this.expose(obj.toString(), name);
    // buffer self-calling function
    } else if ('function' == typeof obj) {
      this.expose(';(' + obj + ')();', name);
    // buffer module object
    } else if (this._require) {
      obj = 'module.exports = ' + renderString(obj);
      this.expose(renderRegister(namespace, obj), name);
    // buffer object
    } else {
      this.expose(renderNamespace(namespace), name);
      this.expose(renderObject(obj, namespace), name);
      this.expose('\n');
    }

    return this;
  },
  
  exposed: function(name){
    name = name || exports.name;
    this.js = this.js || {};
    return this.js[name]
      ? this.js[name].join('\n')
      : '';    
  }
}

function renderRegister(mod, js) {
  return 'require.register("'
    + mod + '", function(module, exports, require){\n'
    + js + '\n});';
}

function renderNamespace(str){
  var parts = []
    , split = str.split('.')
    , len = split.length;
 
  return str.split('.').map(function(part, i){
    parts.push(part);
    part = parts.join('.');
    return (i ? '' : 'window.') + part + ' = typeof ' + part + ' !== \'undefined\' ? ' + part + ' : {};';
  }).join('\n');
}

function renderObject(obj, namespace) {
  return Object.keys(obj).map(function(key){
    var val = obj[key];
    return namespace + '["' + key + '"] = ' + renderString(val) + ';';
  }).join('\n');
}

function renderString(obj) {
  if ('function' == typeof obj) {
    return obj.toString();
  } else if (obj instanceof Date) {
    return 'new Date("' + obj + '")';
  } else if (Array.isArray(obj)) {
    return '[' + obj.map(string).join(', ') + ']';
  } else if ('[object Object]' == Object.prototype.toString.call(obj)) {
    return '{' + Object.keys(obj).map(function(key){
      return '"' + key + '":' + renderString(obj[key]);
    }).join(', ') + '}';
  } else {
    return JSON.stringify(obj);
  }
}

module.exports = Expose;