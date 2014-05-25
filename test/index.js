var expect = require('chai').expect;
var compile = require('..').compile;

describe('ES6ObjectConcise', function() {
  function transform(code) {
    return compile(code).code;
  }

  function expectTransform(code, result) {
    expect(transform(code)).to.eql(result);
  }

  it('should fix ', function() {
    var code = [
      'var a = {',
      '  b() {',
      '    return "c";',
      '  }',
      '};'
    ].join('\n');

    var result = [
      'var a = {',
      '  b: function b() {',
      '    return "c";',
      '  }',
      '};'
    ].join('\n');

    expectTransform(code, result);
  });
});
