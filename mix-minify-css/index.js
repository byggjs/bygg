'use strict';

var CleanCSS = require('clean-css');
var mix = require('mix');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var start = new Date();
        var nodes = tree.nodes.map(function (node) {
            var input = node.data.toString('utf8');
            var output = new CleanCSS(options).minify(input);
            var outputNode = tree.cloneNode(node);
            outputNode.data = new Buffer(output, 'utf8');
            return outputNode;
        });
        console.log('minified CSS in ' + (new Date() - start) + ' ms');
        return new mix.Tree(nodes);
    };
};
