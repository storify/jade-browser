var express = require('express'),
    path = require('path'),
    jade_browser = require('../index.js'),
    expect = require('expect.js'),
    superagent = require('superagent'),
    vm = require('vm'),
    app;

describe("pug browser", function(){
    this.timeout(10000);
    this.slow(8000);

  before(function(done){
    app = express();
    app.use(jade_browser('/template.js', path.join('template', '**/*.pug'), {
      root: __dirname // Only necessary because we are not using this from node_modules
    }));
    app.listen(3003, function() {
      done();
    });
  });

  it('creates an object', function(done){
    expect(app).to.exist;
    superagent.get('http://localhost:3003/template.js').end(function(err,res){
        expect(res.status).to.equal(200);
        var s = res.text.toString();
        expect(s).to.contain('<h1>test</h1>');
        expect(s).to.contain('template/test.pug"');
        done();
    });
  });

    it('renders an object', function(done){
        superagent.get('http://localhost:3003/template.js').end(function(err,res){
            var s = new vm.Script(res.text.toString());
            var c = new vm.createContext({});
            s.runInContext(c);
            var f = c.pug.templates['template/test.pug'];
            expect(f()).to.contain('<h1>test</h1>');
            done();
    });

    });

    describe('preprocessing templates',function(done){

        var server;

        before('activate preprocess server', function(done){
            app = express();
            app.use(jade_browser('/template2.js', path.join('template', '**'), {
                root: __dirname // Only necessary because we are not using this from node_modules
                , preprocess: function(template){
                    return template += '\nh2 test2';
                }
            }));
            server = app.listen(3004,done);
        });

        after('tear down server', function(){
            server.close();
        });

        it('allows a preprocess option', function(done){

            superagent.get('http://localhost:3004/template2.js').end(function(err,res){
                expect(res.status).to.equal(200);
                var s = res.text.toString();
                expect(s).to.contain('<h1>test</h1>');
                expect(s).to.contain('<h2>test2</h2>');
                expect(s).to.contain('template/test.pug"');
                done();
            });

        });

        it('renders preprocessed templates', function(done){
            superagent.get('http://localhost:3004/template2.js').end(function(err,res){
                var s = new vm.Script(res.text.toString());
                var c = new vm.createContext({});
                s.runInContext(c);
                var f = c.pug.templates['template/test.pug'];

                var html = f();

                expect(html).to.contain('<h1>test</h1>');
                expect(html).to.contain('<h2>test2</h2>');

                done();

            });
        });
    });


});
