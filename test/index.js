var jade_browser = require('../index.js');
var expect = require('expect.js');

describe("jade browser", function(){
  before(function(done){
    done();
  })
  it('create an object', function(done){
    var jb = jade_browser('/js/templates.js','**', {});
    // console.log(Object.keys(jb));
    expect(jb).to.exist;
    done();
  })
});
