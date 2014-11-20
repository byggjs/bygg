'use strict';

var SVGO = require('svgo');
var mixlib = require('../lib');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var svgo = new SVGO(options);
        var signal = mixlib.signal();
        var nodes = [];
        var processed = 0;

        tree.nodes.forEach(function (node, index) {
            var input = node.data.toString('utf8');

            svgo.optimize(input, function(result) {
                if (result.error) {
                    processed++;
                    mixlib.logger.error('svgo', result.error);
                    return;
                }

                var outputNode = tree.cloneNode(node);
                outputNode.data = new Buffer(result.data, 'utf8');
                nodes.push(outputNode);
                processed++;

                if (processed === tree.nodes.length) {
                    mixlib.logger.log('svgo', 'Minified ' + tree.nodes.length + ' SVG files');
                    signal.push(mixlib.tree(nodes));
                }
            });
        });

        return signal;
    };
};
