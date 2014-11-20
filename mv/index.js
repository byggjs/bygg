'use strict';

var path = require('path');
var mixlib = require('../lib');

module.exports = function (options) {
    return function (tree) {
        var mvNode = function (node) {
            var outNode = tree.cloneNode(node);
            var newPath = options.stripPath ? path.basename(outNode.name) : outNode.name;
            outNode.name = path.join(options.dir, newPath);
            outNode.siblings = outNode.siblings.map(mvNode);
            return outNode;
        };

        var nodes = tree.nodes.map(mvNode);

        return mixlib.tree(nodes);
    };
};
