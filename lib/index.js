var esprima = require('esprima');
var recast = require('recast');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

var ES6ObjectConcise = recast.Visitor.extend({
  visitProperty: function(expr) {
    if (expr.method && n.FunctionExpression.check(expr.value)) {
      expr.method = false;
      expr.value.id = expr.key;
    }

    this.genericVisit(expr);

    return expr;
  }
});

function transform(ast) {
  (new ES6ObjectConcise()).visit(ast);
  return ast;
}

function compile(code, options) {
  options = options || {};

  var recastOptions = {
    esprima: esprima,
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
