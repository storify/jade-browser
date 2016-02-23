var fs = require('fs')
  , path = require('path')
  , pug = require('pug')
  , async = require('async')
  , qs = require('querystring')
  , glob = require('glob')
  , wrap = require('pug-runtime/wrap')
	, runtime = require('pug-runtime')
  , parser = require('uglify-js').parser
  , compiler = require('uglify-js').uglify
  , Expose = require('./lib/expose')
  , utils = require('./lib/utils');

module.exports = function(exportPath, patterns, options){
  var options = options || {}
    , ext = options.ext || 'pug'
    , namespace = options.namespace || 'pug'
    , built = false
    , noCache = options.noCache || false
    , debug = options.debug || false
    , minify = options.minify || false
    , maxAge = options.maxAge || 86400
    , exportPath = exportPath.replace(/\/$/,'')
    , root = path.normalize(options.root ? options.root.replace(/\/$/,'') : path.join(__dirname, '..', '..'))
    , regexp = utils.toRegExp(exportPath, true)
    , headers = {
          'Cache-Control': 'public, max-age=' + maxAge
        , 'Content-Type': 'text/javascript'
    }
    , preprocess = options.preprocess || function(template){return template;};


  return function(req, res, next){
    if (!req.url.match(regexp)) {
       return next();
    }

    if (built && !noCache) {
      res.writeHead(200, headers);
      res.end(built);
    } else {

      if (typeof patterns == 'string') {
        patterns = [patterns];
      }

      var files = [];
      patterns.forEach(function(pattern) {
        pattern = path.join(root, pattern);
        try {
          var matches = glob.sync(pattern);
          matches = matches.filter(function(match) {
            return match.match(ext + '$');
          });
          files = files.concat(matches);
        } catch(e) {}
      });



      var getTemplate = function(filename, cb) {

          fs.readFile(filename, 'ascii', function(err, content){
              if (err) {
                  return cb(err);
              }
              var transformedContent = preprocess(content);

              var tmpl = pug.compileClient(transformedContent,
                                          {filename: filename,
                                           compileDebug: debug,
                                           pretty: true,
                                           externalRuntime: true,
                                           //  inlineRuntimeFunctions: true
                                          });

              var fn = wrap(tmpl);

            cb(null, {
                filename: filename,
                fn: fn
            });
        });
      };

      var expose = function(e, results) {
          var templates = {}, filename;
        results.forEach(function(template) {
          filename = path.relative(root, template.filename).replace(/\\/g, '/');
          templates[filename] = template.fn;
        });

          runtime.templates = templates;

          var payload = new Expose();

          payload.expose(runtime,namespace,'output');


          var built = 'var ' + namespace + ' = {};';
          built += payload.exposed('output');
          built = renderUnicode(built);

        if (minify) {
          var code = parser.parse(built);
          code = compiler.ast_mangle(code);
          code = compiler.ast_squeeze(code);
          built = compiler.gen_code(code);
        }

        res.writeHead(200, headers);
        res.end(built);
      };

      async.map(files, getTemplate, expose);
    }

  };
};


function renderUnicode(s){
    var re = /\\u([\d\w]{4})/gi;
    s = s.replace(re,function(match,grp){
        return String.fromCharCode(parseInt(grp,16));
    });
    return  qs.unescape(s);

}
