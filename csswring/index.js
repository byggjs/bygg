'use strict';

var csswring = require('csswring');
var path = require('path');
var mixlib = require('../lib');

module.exports = function (options) {
    return function (tree) {
        var nodes = tree.nodes.map(function (node) {
            var start = new Date();
            var input = node.data.toString('utf8');

            var prevSourceMap = mixlib.tree.sourceMap.get(node);
            var opts = {
                from: node.name,
                map: {
                    prev: prevSourceMap !== undefined ? prevSourceMap.data.toString('utf-8') : false,
                    sourcesContent: true,
                    annotation: mixlib.tree.sourceMap.name(node)
                }
            };

            try {
                var outputNode = tree.cloneNode(node);
                var result = csswring(options).wring(input, opts);
                outputNode.data = new Buffer(result.css, 'utf8');

                var sourceMap = JSON.parse(result.map);
                mixlib.tree.sourceMap.set(outputNode, sourceMap, { sourceBase: path.dirname(node.name) });

                mixlib.logger.log('csswring', 'Minified ' + node.name, new Date() - start);
                return outputNode;
            } catch (e) {
                mixlib.logger.error('csswring', e.message);
            }

            return undefined;
        })
        .filter(function (node) {
            return node !== undefined;
        });

        return mixlib.tree(nodes);
    };
};
