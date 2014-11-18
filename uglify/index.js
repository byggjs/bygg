'use strict';

var UglifyJS = require('uglify-js');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

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
                filename: path.join(node.base, node.name),
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

            var sourceMapNode = null;
            var outputOptions = mixIn({}, options.output);
            if (node.metadata.hasOwnProperty('sourceMap')) {
                sourceMapNode = node.siblings[node.metadata.sourceMap];
                var sourceMapBlob = sourceMapNode.data.toString('utf8');
                outputOptions.source_map = UglifyJS.SourceMap({
                    file: node.name,
                    orig: sourceMapBlob,
                    root: options.sourceRoot
                });
                var sourceMap = JSON.parse(sourceMapBlob);
                var outputMap = outputOptions.source_map.get();
                sourceMap.sources.forEach(function (source, i) {
                    outputMap.setSourceContent(source, sourceMap.sourcesContent[i]);
                });
            }

            var outputSource = ast.print_to_string(outputOptions);
            if (sourceMapNode !== null) {
                outputSource += '\n//# sourceMappingURL=./' + path.basename(sourceMapNode.name);
            }

            var outputNode = tree.cloneNode(node);
            outputNode.data = new Buffer(outputSource, 'utf8');
            if (sourceMapNode !== null) {
                outputNode.siblings[node.metadata.sourceMap] = {
                    name: sourceMapNode.name,
                    data: new Buffer(outputOptions.source_map + '', 'utf8')
                };
            }

            mix.logger.log('uglify', 'Minified ' + node.name, new Date() - start);

            return outputNode;
        });

        return mix.tree(nodes);
    };
};
