var Kefir = require('kefir');
var Syntax = require('esprima').Syntax;
var traverse = require('estraverse').traverse;

function requireDependencies(module) {
    console.log('require processing:', module);

    var requireNodes = [];
    var resolveNodes = [];
    var jsonNodes = [];

    traverse(module.ast, {
        enter: function (node, parent) {
            if (node.type !== Syntax.CallExpression || node.arguments.length !== 1) {
                return;
            }
            var argument = node.arguments[0];
            if (argument.type !== Syntax.Literal) {
                return;
            }

            var callee = node.callee;
            if (callee.type === Syntax.Identifier && callee.name === 'require') {
                var isJsonProp = parent.type === Syntax.MemberExpression && /\.json$/.test(argument.value);
                var isNonComputedJsonProp = isJsonProp && parent.property.type === Syntax.Identifier && !parent.computed;
                var isLiteralJsonProp = isJsonProp && parent.property.type === Syntax.Literal;

                if (isNonComputedJsonProp) {
                    jsonNodes.push({
                        node: node,
                        value: argument.value,
                        key: parent.property.name,
                        parent: parent
                    });
                } else if (isLiteralJsonProp) {
                    jsonNodes.push({
                        node: node,
                        value: argument.value,
                        key: parent.property.value,
                        parent: parent
                    });
                } else {
                    requireNodes.push({
                        node: node,
                        value: argument.value,
                        parent: parent
                    });
                }
            } else if (
                    // require.resolve
                    callee.type === Syntax.MemberExpression && callee.object.type === Syntax.Identifier &&
                    callee.object.name === 'require' && callee.property.type === Syntax.Identifier &&
                    callee.property.name === 'resolve') {
                resolveNodes.push({
                    node: node,
                    value: argument.value,
                    parent: parent
                });
            }
        }
    });

    if (resolveNodes.length > 0) {
        throw new Error('require.resolve() is not yet supported');
    }
    if (jsonNodes.length > 0) {
        throw new Error('require JSON syntax is not yet supported');
    }

    var requires = requireNodes.map(function (r) {
        return this._require(r.value);
    }.bind(this));

    return Kefir.combine(requires, function () {
        console.log('combine:', arguments);
        return 1337;
    });
}

module.exports = requireDependencies;
