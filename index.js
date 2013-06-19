var fs = require('fs')
  , path = require('path')
  , jade = require('jade')
  , async = require('async')
  , glob = require('glob')
  , parser = require('uglify-js').parser
  , compiler = require('uglify-js').uglify
  , Expose = require('./lib/expose')
  , render = require('./lib/render').render
  , utils = require('./lib/utils');

module.exports = function(exportPath, patterns, options){
  var options = options || {}
    , ext = options.ext || 'jade'
    , namespace = options.namespace || 'jade'
    , built = false
    , noCache = options.noCache || false
    , debug = options.debug || false
    , minify = options.minify || false
    , maxAge = options.maxAge || 86400
    , exportPath = exportPath.replace(/\/$/,'')
    , root = path.normalize(options.root ? options.root.replace(/\/$/,'') : __dirname)
    , regexp = utils.toRegExp(exportPath, true)
    , headers = {
          'Cache-Control': 'public, max-age=' + maxAge
        , 'Content-Type': 'text/javascript' 
      };

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

      async.map(files, getTemplate, expose);

      function getTemplate(filename, cb) {
        
        fs.readFile(filename, 'utf8', function(err, content){
          if (err) {
            return cb(err);
          }

          var tmpl = jade.compile(content, {
              filename: filename
            , inline: false
            , compileDebug: false
            , client: true
          });
          
          if (typeof tmpl == 'function') {
            var fn = 'var jade=window.' + namespace + '; return anonymous(locals);'+ tmpl.toString();
            fn = new Function('locals', fn);
            
            cb(null, {
                filename: filename
              , fn: fn
            });
          } else {
            cb(new Error('Failed to compile'));
          }
          
        }); 
      }

      function expose(e, results) {
        var templates = {}, filename;
        results.forEach(function(template) {
          filename = path.relative(root, template.filename);
          templates[filename] = template.fn;
        });

        var code = jade.runtime.escape.toString() +';'
        code += jade.runtime.attrs.toString().replace(/exports\./g, '') + ';'
        code += ' return attrs(obj);'
        
        var payload = new Expose();
        payload.expose({
            attrs: new Function('obj', code)
          , escape: jade.runtime.escape
          , dirname: utils.dirname
          , normalize: utils.normalize
          , render: render(namespace)
          , templates: templates
        }, namespace, 'output');
        
        built = payload.exposed('output');
        
        if (minify) {
          var code = parser.parse(built);
          code = compiler.ast_mangle(code);
          code = compiler.ast_squeeze(code);
          built = compiler.gen_code(code);
        }

        res.writeHead(200, headers);
        res.end(built);
      }
      
    }
  }
}
