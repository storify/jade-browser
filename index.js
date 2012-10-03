var fs = require('fs')
  , path = require('path')
  , jade = require('jade')
  , async = require('async')
  , glob = require('glob')
  , parser = require('uglify-js').parser
  , compiler = require('uglify-js').uglify
  , Expose = require('./lib/expose')
  , render = require('./lib/render').render
  , utils = require('./lib/utils')
  , crypto = require('crypto');

var defaultOptions = exports.defaultOptions =
  function(exportPath, patterns, options) {
    var options = options || {};
    options.ext = options.ext || 'jade';
    options.namespace = options.namespace || 'jade';
    options.built = false;
    options.minified = false;
    options.debug = options.debug || false;
    options.minify = options.minify || false;
    options.maxAge = options.maxAge || 86400;
    options.exportPath = exportPath.replace(/\/$/,'');
    options.root = path.normalize(options.root ? options.root.replace(/\/$/,'') : __dirname);
    options.regexp = utils.toRegExp(exportPath, true);
    options.headers = {
        'Cache-Control': 'public, max-age=' + options.maxAge
      , 'Content-Type': 'text/javascript'
    };

    if (typeof patterns == 'string') {
      patterns = [patterns];
    }
    options.patterns = patterns;
    options.files = [];

    if (options.checksum) {
      options.checksumFile = options.cacheRoot +
                             options.exportPath.replace('.js', '-checksum.js');
      try {
        options.checksums = require(options.checksumFile);
      } catch(e) {}
    }
    return options;
};

var middleware = exports.middleware = function(exportPath, patterns, options) {
  options = options || {};
  options = defaultOptions(exportPath, patterns, options);

  return function(req, res, next){
    if (!req.url.match(options.regexp)) {
       return next();
    };

    function render() {
      res.writeHead(200, options.headers);
      res.end(options.built);
    };

    if (options.built) return render();
    process(options, render);
  }
};

var watch = exports.watch = function(exportPath, patterns, options, callback) {
  options = options || {};
  options = defaultOptions(exportPath, patterns, options);

  var files = exports.files(options);
  console.log('Watching jade namespace:', options.namespace);
  files.forEach(function(fd) {

    // console.log('Watching:', fd);
    fs.watchFile(fd, {persistent: true, interval: 500}, function(curr, prev) {
      // make sure we don't fire twice...
      if (curr.mtime.getTime() === prev.mtime.getTime()) return;
      console.log("File changed:", fd);

      options.built = false;
      options.minified = false;
      recache(options, callback)

    })
  });

};

var cache = exports.cache = function(exportPath, patterns, options, callback) {
  options = options || {};
  options = defaultOptions(exportPath, patterns, options);
  recache(options, callback);
}

var recache = function(options, callback) {
  process(options, function() {
    if (checksumsChanged(options)) {
      write(options);
    }
    if (callback) callback();
  });
};

var write = function(options) {
  console.log('Caching jade namespace:', options.namespace);
  var filename = options.cacheRoot + options.exportPath;

  // cache development version
  fs.writeFileSync(filename, options.built, 'utf8');

  // cache minified version
  if (options.minify) {
    fs.writeFileSync(filename.replace('.js', '.min.js'), options.minified, 'utf8');
  }
  // do we have an event listener?
  if (options.onWrite && typeof(options.onWrite) === 'function') {
    options.onWrite();
  };

}

var checksumsChanged = function(options) {
  var start = new Date().getTime();

  var namespace = options.namespace;
  var checksums = {};

  var hash = crypto.createHash('md5');
  hash.update(options.built);
  checksums[namespace] = hash.digest('hex');

  // do we have a minified checksum?
  if (options.minify) {
    hash = crypto.createHash('md5');
    hash.update(options.minified);
    checksums[namespace + '.min'] = hash.digest('hex');
  }

  // only write the checksums if they've changed
  if (!options.checksums ||
      options.checksums[namespace] !== checksums[namespace]) {
        options.checksums = checksums;
        fs.writeFileSync(options.checksumFile, 'module.exports = ' + JSON.stringify(checksums));
        console.log('Writing checksums for namespace:', namespace);
        return true;
  }

  console.log('No changes with jade namespace:', namespace);
  return false;
}

var files = exports.files = function(options) {
  if (options.files && options.files.length) return options.files;

  var files = [];
  options.patterns.forEach(function(pattern) {
    pattern = path.join(options.root, pattern);

    try {
      var matches = glob.sync(pattern);
      matches = matches.filter(function(match) {
        return match.match(options.ext + '$');
      });
      files = files.concat(matches);
    } catch(e) {}
  });
  options.files = files;
  // console.log('Matched', files.length, 'files to watch');

  return files;
}

var process = exports.process = function(options, callback) {

  if (!options.files || !options.files.length) {
    options.files = exports.files(options);
  }

  var getFile = function(filename, callback) {
    fs.readFile(filename, 'utf8', function(err, content){
      if (err) return callback(err);

      var tmpl = jade.compile(content, {
          filename: filename
        , inline: false
        , compileDebug: false
        , client: true
      });

      if (typeof tmpl == 'function') {
        var fn = 'var jade=window.' + options.namespace + '; return anonymous(locals);'+ tmpl.toString();
        fn = new Function('locals', fn);

        callback(null, {
            filename: filename
          , fn: fn
        });
      } else {
        callback(new Error('Failed to compile'));
      }

    });
  };

  async.map(options.files, getFile, function(err, files) {
    build(options, files, callback);
  })
}

var build = exports.build = function(options, files, callback) {
  // console.log('Start building namespace', options.namespace);
  var start = new Date().getTime();

  var templates = {}, filename;
  files.forEach(function(template) {
    filename = template.filename.replace(options.root + '/', '')
    templates[filename] = template.fn;
  });

  var code = jade.runtime.escape.toString() +';'
  code += jade.runtime.attrs.toString().replace(/exports\./g, '') + ';'
  code += ' return attrs(obj, escaped);'

  // need to remove the escape from the name of the function...
  // leaks into the global namespace in IE and clobbers default escape
  // copy here to avoid sting subs on runtime.escape
  var escape = function(html){
    return String(html)
      .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  var payload = new Expose();
  payload.expose({
      attrs: new Function('obj', 'escaped', code)
    , escape: escape
    , dirname: utils.dirname
    , normalize: utils.normalize
    , render: render(options.namespace)
    , templates: templates
  }, options.namespace, 'output');

  // cache
  options.built = payload.exposed('output');

  if (options.minify) {
    var code = parser.parse(options.built);
    code = compiler.ast_mangle(code);
    code = compiler.ast_squeeze(code);
    options.minified = compiler.gen_code(code);
  }

  // console.log('Finished building', options.namespace, new Date().getTime() - start + 'ms');
  callback();
}
