'use strict';

var UglifyJS = require('uglify-js');
var mixIn = require('mout/object/mixIn');
var path = require('path');
var fs = require('fs');
var mixlib = require('../lib');

module.exports = function (options) {
    options = mixIn({
        screw_ie8: true,
        warnings: false,
        compress: {},
        mangle: {},
        output: {},
        sourceRoot: null
    }, options || {});

    if (options.screw_ie8) {
        options.compress.screw_ie8 = true;
        options.mangle.screw_ie8 = true;
        options.output.screw_ie8 = true;
    }

    return function (tree) {
        var nodes = tree.nodes.map(function (node) {
            var start = new Date();
            var source = node.data.toString('utf8');

            var ast = UglifyJS.parse(source, {
                filename: node.name,
                toplevel: null
            });

            var scopeOptions = { screw_ie8: options.screw_ie8 };

            if (options.compress) {
                ast.figure_out_scope(scopeOptions);
                var compressOptions = mixIn({ warnings: options.warnings }, options.compress);
                ast = ast.transform(UglifyJS.Compressor(compressOptions));
            }

            if (options.mangle) {
                ast.figure_out_scope(scopeOptions);
                ast.compute_char_frequency();
                ast.mangle_names(options.mangle);
            }

            var prevSourceMap = mixlib.tree.sourceMap.get(node);
            var sourceMap = UglifyJS.SourceMap({
                orig: prevSourceMap !== undefined ? prevSourceMap.data.toString('utf-8') : false,
                root: options.sourceRoot
            });
            var outputOptions = mixIn({}, options.output, {
                source_map: sourceMap
            });

            var outputSource = ast.print_to_string(outputOptions);
            var outputNode = tree.cloneNode(node);
            outputNode.data = new Buffer(outputSource, 'utf8');

            var sourceMapData = JSON.parse(sourceMap.toString());
            mixlib.tree.sourceMap.set(outputNode, sourceMapData, {
                annotate: true,
                sourceBase: prevSourceMap === undefined ? path.dirname(node.name) : undefined
            });

            mixlib.logger.log('uglify', 'Minified ' + node.name, new Date() - start);

            return outputNode;
        });

        return mixlib.tree(nodes);
    };
};
