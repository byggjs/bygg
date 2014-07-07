var Transform = require('mix').Transform;

module.exports = function () {
    return new Rev();
};

Rev.prototype = Object.create(Transform.prototype);
Rev.prototype.constructor = Rev;

function Rev() {
    Transform.call(this);
}

Rev.prototype._transform = function (tree, next) {
    // TODO: implement
    next(tree);
};
