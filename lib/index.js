var recast = require('recast');
var types = recast.types;
var astUtil = require('ast-util');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

var VISITOR = types.PathVisitor.fromMethodsObject({
  visitProperty: function(path) {
    var expr = path.node;

    if (expr.method && n.FunctionExpression.check(expr.value)) {
      var fnArg = astUtil.uniqueIdentifier(path.scope, expr.key.name);
      expr.method = false;

      if (refersTo(expr.value, expr.key)) {
        expr.value = b.callExpression(
          b.functionExpression(
            null,
            [fnArg],
            b.blockStatement([
              b.returnStatement(
                b.functionExpression(
                  expr.key,
                  [],
                  b.blockStatement([
                    b.returnStatement(
                      b.callExpression(
                        b.memberExpression(
                          fnArg,
                          b.identifier('apply'),
                          false
                        ),
                        [
                          b.thisExpression(),
                          b.identifier('arguments')
                        ]
                      )
                    )
                  ])
                )
              )
            ])
          ),
          [expr.value]
        );
      } else {
        expr.value.id = expr.key;
      }
    }

    return expr;
  }
});

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
  recast.visit(ast, VISITOR);
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
