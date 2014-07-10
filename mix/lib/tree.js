module.exports = Tree;

function Tree(nodes) {
    this.nodes = nodes;
}

Tree.prototype.findNodeByName = function (name) {
    for (var nodeIndex = 0; nodeIndex !== this.nodes.length; nodeIndex++) {
        var node = this.nodes[nodeIndex];
        if (node.name === name) {
            return node;
        }
        for (var siblingIndex = 0; siblingIndex !== node.siblings.length; siblingIndex++) {
            var sibling = node.siblings[siblingIndex];
            if (sibling.name === name) {
                return {
                    name: sibling.name,
                    base: node.base,
                    data: sibling.data,
                    stat: sibling.stat,
                    siblings: []
                };
            }
        }
    }
    return null;
};

Tree.merge = function () {
    var result = new Tree([]);
    for (var i = 0; i !== arguments.length; i++) {
        var tree = arguments[i];
        result.nodes.push.apply(result.nodes, tree.nodes);
    }
    return result;
};
