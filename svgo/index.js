'use strict';

var mix = require('mix');
var SVGO = require('svgo');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var svgo = new SVGO(options);
        var signal = mix.signal();
        var nodes = [];
        var processed = 0;

        tree.nodes.forEach(function (node, index) {
            var input = node.data.toString('utf8');

            svgo.optimize(input, function(result) {
                if (result.error) {
                    processed++;
                    mix.logger.error('svgo', result.error);
                    return;
                }

                var outputNode = tree.cloneNode(node);
                outputNode.data = new Buffer(result.data, 'utf8');
                nodes.push(outputNode);
                processed++;

                if (processed === tree.nodes.length) {
                    mix.logger.log('svgo', 'Minified ' + tree.nodes.length + ' SVG files');
                    signal.push(mix.tree(nodes));
                }
            });
        });

        return signal;
    };
};
