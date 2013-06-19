var express = require('express'),
  jade_browser = require('../index.js'),
  expect = require('expect.js'),
  superagent = require('superagent'),
  app;

describe("jade browser", function(){
  
  before(function(done){
    app = express();
    app.use(jade_browser('/template.js', 'test/template/**'));
    app.listen(3003, function() {
      done();
    });
  })

  it('create an object', function(done){

    expect(app).to.exist;
    superagent.get('http://localhost:3003/template.js').end(function(res){
      expect(res.status).to.equal(200);
      expect(res.text.toString()).to.contain('<h1>test</h1>');
      expect(res.text.toString()).to.contain('test/template/test.jade"');
      done();
    });
  });

});
