'use strict';

var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');
var sass = require('node-sass');
var fs = require('fs');

module.exports = function (options) {
    var watcher;

    return function (tree) {
        if (watcher !== undefined) {
            watcher.dispose();
        }

        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one scss file must be specified');
        }


        var node = tree.nodes[0];
        var signal = mix.signal();
        watcher = mix.watcher();
        var deps = [];

        var pushCss = function () {
            var sassFile = path.join(node.base, node.name);
            var stats = {};
            var start = new Date();

            sass.render(mixIn({}, options, {
                file: sassFile,
                sourceComments: 'map',
                stats: stats,
                sourceMap: '#SOURCE_MAP#',
                success: function (css) {
                    deps = stats.includedFiles.filter(function (path) {
                        return path !== sassFile;
                    });
                    watcher.watch(deps);

                    var outputNode = tree.cloneNode(node);
                    var outputPrefix = path.dirname(node.name) + '/';
                    if (outputPrefix === './') {
                        outputPrefix = '';
                    }
                    outputNode.name = outputPrefix + path.basename(node.name, path.extname(node.name)) + '.css';
                    outputNode.metadata.mime = 'text/css';

                    // Process source map
                    var sourceMapData = JSON.parse(stats.sourceMap);
                    sourceMapData.sourcesContent = [];

                    var sourcePrefix = path.join(node.base, outputPrefix);
                    sourceMapData.sources = sourceMapData.sources.map(function (source) {
                        sourceMapData.sourcesContent.push(fs.readFileSync(source, {encoding: 'utf-8'}));
                        return path.relative(sourcePrefix, source);
                    });
                    outputNode.metadata.sourceMap = outputNode.siblings.length;
                    outputNode.siblings.push({
                        name: outputNode.name + '.map',
                        data: new Buffer(JSON.stringify(sourceMapData), 'utf-8')
                    });

                    css = css.replace('#SOURCE_MAP#', './' + path.basename(outputNode.name) + '.map');
                    outputNode.data = new Buffer(css, 'utf8');

                    signal.push(mix.tree([outputNode]));

                    mix.logger.log('sass', 'Compiled ' + outputNode.name, new Date() - start);
                },
                error: function (error) {
                    mix.logger.error('sass', error);
                }
            }));
        };

        watcher.listen(function (paths) {
            pushCss();
        });

        pushCss();

        return signal;
    };
};
