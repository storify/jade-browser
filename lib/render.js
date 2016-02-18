
function render(template, options){
  var options = options || {}
    , parent = {};
    
  if(!template.match(/\.jade$/)) template += '.jade';
  template = ns.normalize(template);

  options.partial = function(path, opts){
     var opts = (function(a, b){
        if (a && b) { for (var key in b) { a[key] = (typeof a[key] == 'undefined') ? b[key] : a[key]; } }
        return a;
      })(opts || {}, options);
      
    if(!path.match(/\.jade$/)) path += '.jade';
    path = ns.normalize(path);
    
    if(!ns.templates[path]) path = ns.normalize(ns.dirname(template) + path);
    return ns.render(path, opts);
  }
  return ns.templates[template](options);
}

exports.render = function(ns){
  var fn = 'var ns= '+ns+'; return render(template, options); '+ render.toString();
  return new Function('template','options', fn);
}
