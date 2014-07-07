var Transform = require('mix').Transform;

module.exports = function () {
    return new Stats();
};

Stats.prototype = Object.create(Transform.prototype);
Stats.prototype.constructor = Stats;

function Stats() {
    Transform.call(this);
}

Stats.prototype._transform = function (tree, next) {
    // TODO: implement
    next(tree);
};
