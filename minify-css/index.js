'use strict';

var CleanCSS = require('clean-css');
var mix = require('mix');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var nodes = tree.nodes.map(function (node) {
            var start = new Date();
            var input = node.data.toString('utf8');
            var output = new CleanCSS(options).minify(input);
            var outputNode = tree.cloneNode(node);
            outputNode.data = new Buffer(output, 'utf8');

            mix.logger.log('minify-css', 'Minified ' +  node.name, new Date() - start);

            return outputNode;
        });

        return mix.tree(nodes);
    };
};
