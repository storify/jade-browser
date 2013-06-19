# Jade Browser

[![Jade Browser build status](https://travis-ci.org/storify/jade-browser.png)](https://travis-ci.org/storify/jade-browser)


  Middleware for express/connect to expose jade templates to the web browser. It provides a few additional features like express-like render function with partial handling.
  
```javascript
var express = require('express')
  , jade_browser = require('jade-browser')
  , app = express.createServer();
  
app.use(jade_browser(url_endpoint, template_dir, options));
```

or for Express.js v3.x:

```javascript
var express = require('express')
  , jade_browser = require('jade-browser')
  , app = express();
  
app.use(jade_browser(url_endpoint, template_dir, options));
```

## Installation

    $ npm install jade-browser
  
## Features

  * Jade templates are served as compiled functions.
    * removes browser compatibility issues
    * increases speed of template execution
    * reduces file transfer size
  * ability to minify output
  * option to attach cache control
  * provides helpers for handling rendering/partials just like express.
  * relative path handling even from within partials.
  * ability to completely namespace to avoid any naming collisions on the browser.
  * partials inherit parent locals

## Usage

### In Node.js

  As middleware jade-browser is simple to use.

```javascript
var express = require('express')
  , jade_browser = require('jade-browser')
  , app = express.createServer();

app.use(jade_browser('/js/templates.js', '**', options));
```

### Params

  - `filename`  The filename of the resulting compiled templates file
  - `patterns`  A single string or array of patterns used to glob for template files
  - `options`   Options object, see below (optional)

#### Options

  - `root`      The root of the views (default: __dirname)
  - `namespace` Namespace for the browser (default: 'jade')
  - `minify`    Minifies the output (default: false)
  - `maxAge`    Time in seconds to cache the results (default: 86400)
  - `noCache`   Recompiles the output on every request (default: false)
  
### Browser

```javascript
jade.render('path/to/template', { values: for_template });
```
    
For direct access (for templates that have no need for partials).

```javascript
jade.templates['path/to/template.jade'](locals);
```
    
Note: With render '.jade' extension is not required. Relative paths can be used in templates and in render function.

```javascript
jade.render('path/../to/../test');
```

## Credits

  Large amounts of this code is inspired by TJ. Parts of express-expose and internal parts of express are recycled to make this happen. Contibuting docs part is taken from [Mongoosastic](https://github.com/storify/mongoosastic/blob/master/readme.md).

## Contributors

The list of contributors according to `git shortlog -s -n`:

* 15  Conner Petzold ([cpetzold](http://github.com/cpetzold))
* 12  Nathan White ([nw](http://github.com/nw))
* 9  Azat Mardanov
* 4  Patrick Forringer
* 2  Vincent Battaglia
* 2  Arlo Breault
* 2  RashFael
* 1  Adrian Bravo ([adrianbravo](http://github.com/adrianbravo))


## Contributing

Pull requests are always welcome as long as an accompanying test case is
associated. 

This project is configured to use [git
flow](https://github.com/nvie/gitflow/) and the following conventions
are used:

* ``dev`` - represents current active development and can possibly be
  unstable. 

* ``master`` - pristine copy of repository, represents the currently
  stable release found in the npm index.

* ``feature/**`` - represents a new feature being worked on

If you wish to contribute, the only requirement is to: 

- branch a new feature branch from develop (if you're working on an
  issue, prefix it with the issue number)
- make the changes, with accompanying test cases
- issue a pull request against develop branch

Although I use git flow and prefix feature branches with "feature/" I
don't require this for pull requests... all I care is that the feature
branch name makes sense. 

Pulls requests against master or pull requests branched from master will
be rejected.

#### Examples

Examples of good branch names:

* 12-amd-support
* feature/12-amd-support


### Running Tests

In order to run the tests which are in `test` folder, you will need:

* Node.js
* NPM

With those installed, running `npm install` and ''npm test'' will run the tests.

    
## License 

(The MIT License)

Copyright (c) 2009-2011 Storify &lt;info@storify.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
