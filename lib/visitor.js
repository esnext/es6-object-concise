var recast = require('recast');
var types = recast.types;
var astUtil = require('ast-util');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

function Visitor() {
  types.PathVisitor.call(this);
}

Visitor.prototype = Object.create(types.PathVisitor.prototype);
Visitor.prototype.constructor = Visitor;

Visitor.prototype.visitProperty = function(path) {
  var expr = path.node;

  if (expr.method && n.FunctionExpression.check(expr.value)) {
    expr.method = false;

    if (refersTo(expr.value, expr.key)) {
      var fnArg = astUtil.uniqueIdentifier(path.scope, expr.key.name);
      var wrapperFn = astUtil.uniqueIdentifier(path.scope, 'wrapper');

      expr.value = b.callExpression(
        b.functionExpression(
          null,
          [fnArg],
          b.blockStatement([
            b.variableDeclaration(
              'var',
              [
                b.variableDeclarator(
                  wrapperFn,
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
              ]
            ),
            b.expressionStatement(
              b.assignmentExpression(
                '=',
                b.memberExpression(
                  wrapperFn,
                  b.identifier('toString'),
                  false
                ),
                b.functionExpression(
                  null,
                  [],
                  b.blockStatement([
                    b.returnStatement(
                      b.callExpression(
                        b.memberExpression(
                          fnArg,
                          b.identifier('toString'),
                          false
                        ),
                        []
                      )
                    )
                  ])
                )
              )
            ),
            b.returnStatement(wrapperFn)
          ])
        ),
        [expr.value]
      );
    } else {
      expr.value.id = expr.key;
    }
  }

  return expr;
};

Visitor.visitor = new Visitor();

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
module.exports = Visitor;
