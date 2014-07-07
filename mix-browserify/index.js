var Kefir = require('kefir');
var esprima = require('esprima');
var Transform = require('mix').Transform;

module.exports = function () {
    return new Browserify();
};

Browserify.prototype = Object.create(Transform.prototype);
Browserify.prototype.constructor = Browserify;

function Browserify() {
    Transform.call(this);
}

Browserify.prototype._transform = function (tree, next) {
    if (tree.nodes.length > 1) {
        throw new Error('Only one file may be specified for browserification');
    }

    var node = tree.nodes[0];
    var ast = esprima.parse(node.data);
    console.log('ast:', ast);

    // TODO: implement
    next(tree);
};
