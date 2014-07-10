var UglifyJS = require('uglify-js');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

module.exports = function (options) {
    options = mixIn({}, {
        warnings: false,
        compress: {},
        mangle: {},
        output: null,
        sourceRoot: null
    }, options || {});

    return function (tree) {
        var start = new Date();
        var nodes = tree.nodes.map(function (node) {
            var filename = path.join(node.base, node.name);
            var source = node.data.toString('utf8');

            var ast = UglifyJS.parse(source, {
                filename: filename,
                toplevel: null
            });

            if (options.compress) {
                ast.figure_out_scope();
                var compressOptions = mixIn({ warnings: options.warnings }, options.compress);
                ast = ast.transform(UglifyJS.Compressor(compressOptions));
            }

            if (options.mangle) {
                ast.figure_out_scope();
                ast.compute_char_frequency();
                ast.mangle_names(options.mangle);
            }

            var sourceMap = null;
            var outputOptions = {};
            if (node.metadata.hasOwnProperty('sourceMap')) {
                sourceMap = node.siblings[node.metadata.sourceMap];
                outputOptions.source_map = UglifyJS.SourceMap({
                    file: node.name,
                    orig: sourceMap.data.toString('utf8'),
                    root: options.sourceRoot
                });
                outputOptions.source_map.get().setSourceContent(filename, source);
            }

            var outputSource = ast.print_to_string(outputOptions);
            if (sourceMap !== null) {
                outputSource += '\n//# sourceMappingURL=./' + path.basename(sourceMap.name);
            }

            var outputNode = mixIn({}, node, {
                data: new Buffer(outputSource, 'utf8')
            });
            if (sourceMap !== null) {
                outputNode.siblings[node.metadata.sourceMap] = {
                    name: sourceMap.name,
                    data: new Buffer(outputOptions.source_map + '', 'utf8')
                };
            }

            return outputNode;
        });
        console.log('minified JS in ' + (new Date() - start) + ' ms');
        return new mix.Tree(nodes);
    };
};
