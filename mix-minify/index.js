var Kefir = require('kefir');
var Transform = require('mix').Transform;

module.exports = function () {
    return new Minify();
};

Minify.prototype = Object.create(Transform.prototype);
Minify.prototype.constructor = Minify;

function Minify() {
    Transform.call(this);
}

Minify.prototype._transform = function (tree, next) {
    // TODO: implement
    next(tree);
};
