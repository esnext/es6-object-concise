var recast = require('recast');
var types = recast.types;
var astUtil = require('ast-util');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

var Visitor = require('./visitor');

function refersTo(fn, identifier) {
  var result = false;

  recast.visit(fn, types.PathVisitor.fromMethodsObject({
    visitIdentifier: function(path) {
      if (!result && astUtil.isReference(path, identifier.name)) {
        result = true;
      }

      return false;
    }
  }));

  return result;
}

function transform(ast) {
  recast.visit(ast, Visitor.visitor);
  return ast;
}

function compile(code, options) {
  options = options || {};

  var recastOptions = {
    sourceFileName: options.sourceFileName,
    sourceMapName: options.sourceMapName
  };

  var ast = recast.parse(code, recastOptions);
  return recast.print(transform(ast), recastOptions);
}

module.exports = function () {
  var data = '';

  function write(buf) {
    data += buf;
  }

  function end() {
    this.queue(compile(data).code);
    this.queue(null);
  }

  return through(write, end);
};

module.exports.transform = transform;
module.exports.compile = compile;
