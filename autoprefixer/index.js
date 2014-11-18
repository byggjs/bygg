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

            var opts;
            var sourceMap = null;
            if (node.metadata.hasOwnProperty('sourceMap')) {
                sourceMap = node.siblings[node.metadata.sourceMap];
                opts = {
                    from: node.name,
                    map: {
                        from: sourceMap.name,
                        prev: sourceMap.data.toString('utf-8'),
                        annotation: './' + path.basename(sourceMap.name)
                    }
                };
            }

            var result = autoprefixer.call(constraints).process(input, opts);

            var outputNode = tree.cloneNode(node);
            outputNode.data = new Buffer(result.css, 'utf8');

            if (sourceMap !== null) {
                sourceMap.data = new Buffer(result.map.toString(), 'utf-8');
            }

            return outputNode;
        });
        return new mix.Tree(nodes);
    };
};
