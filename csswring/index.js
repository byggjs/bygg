'use strict';

var csswring = require('csswring');
var mix = require('mix');
var path = require('path');

module.exports = function (options) {
    return function (tree) {
        var nodes = tree.nodes.map(function (node) {
            var start = new Date();
            var input = node.data.toString('utf8');

            var prevSourceMap = node.siblings[node.metadata.sourceMap];
            var opts = {
                from: node.name,
                map: {
                    prev: prevSourceMap !== undefined ? prevSourceMap.data.toString('utf-8') : false,
                    sourcesContent: true,
                    annotation: mix.tree.sourceMap.name(node)
                }
            };

            try {
                var outputNode = tree.cloneNode(node);
                var result = csswring(options).wring(input, opts);
                outputNode.data = new Buffer(result.css, 'utf8');

                var sourceMap = JSON.parse(result.map);
                mix.tree.sourceMap.set(outputNode, sourceMap);

                mix.logger.log('csswring', 'Minified ' + node.name, new Date() - start);
                return outputNode;
            } catch (e) {
                mix.logger.error('csswring', e.message);
            }

            return undefined;
        })
        .filter(function (node) {
            return node !== undefined;
        });

        return mix.tree(nodes);
    };
};
