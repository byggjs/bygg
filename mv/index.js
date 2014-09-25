'use strict';

var path = require('path');
var mix = require('mix');

module.exports = function (options) {
    return function (tree) {
        var mvNode = function (node) {
            var newPath = options.stripPath ? path.basename(node.name) : node.name;
            node.name = path.join(options.dir, newPath);
            return node;
        };

        var nodes = tree.nodes.map(function (node) {
            node = mvNode(node);
            node.siblings = node.siblings.map(mvNode);
            return node;
        });

        return new mix.Tree(nodes);
    };
};
