module.exports = Tree;

function Tree(nodes, origin) {
    origin = origin || null;

    this.nodes = nodes;
    if (origin !== null) {
        this.origins = [origin];
    } else {
        this.origins = [];
    }
}

Tree.prototype.notifyOrigins = function (event) {
    this.origins.forEach(function (origin) {
        origin.push(event);
    });
};

Tree.merge = function () {
    var result = new Tree([]);
    for (var i = 0; i !== arguments.length; i++) {
        var tree = arguments[i];
        result.nodes.push.apply(result.nodes, tree.nodes);
        result.origins.push.apply(result.origins, tree.origins);
    }
    return result;
};
