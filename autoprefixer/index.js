'use strict';

var autoprefixer = require('autoprefixer-core');
var mix = require('mix');
var path = require('path');

var DEFAULT_CONSTRAINTS = ['last 2 versions', 'ie 9'];

module.exports = function () {
    var constraints = arguments.length > 0 ? Array.prototype.slice.call(arguments) : DEFAULT_CONSTRAINTS;

    return function (tree) {
        var start = new Date();
        var nodes = tree.nodes.map(function (node) {
            var input = node.data.toString('utf8');

            var prevSourceMap = node.siblings[node.metadata.sourceMap];
            var opts = {
                from: node.name,
                map: {
                    prev: prevSourceMap !== undefined ? prevSourceMap.data.toString('utf-8') : false,
                    sourcesContent: true,
                    annotation: false
                }
            };

            var result = autoprefixer.call(constraints).process(input, opts);

            var outputNode = tree.cloneNode(node);
            outputNode.data = new Buffer(result.css, 'utf8');

            var sourceMap = JSON.parse(result.map);
            mix.tree.sourceMap.set(outputNode, sourceMap);

            return outputNode;
        });

        return mix.tree(nodes);
    };
};
