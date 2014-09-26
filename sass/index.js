'use strict';

var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');
var sass = require('node-sass');
var fs = require('fs');

module.exports = function (options) {
    var currentSink = null;

    return function (tree) {
        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one scss file must be specified');
        }
        var node = tree.nodes[0];

        if (currentSink !== null) {
            currentSink.close();
            currentSink = null;
        }

        return new mix.Stream(function (sink) {
            currentSink = sink;

            var disposed = false;
            var watcher = new mix.Watcher();
            var depFiles = [];
            watcher.on('change', function () {
                depFiles.forEach(function (path) {
                    watcher.remove(path);
                });
                depFiles = [];
                pushCss();
            });

            pushCss();

            function pushCss() {
                var sassFile = path.join(node.base, node.name);
                var stats = {};
                var start = new Date();
                sass.render(mixIn({}, options, {
                    file: sassFile,
                    sourceComments: 'map',
                    stats: stats,
                    sourceMap: '#SOURCE_MAP#',
                    success: function (css) {
                        if (disposed) {
                            return;
                        }
                        depFiles = stats.includedFiles.filter(function (path) {
                            return path !== sassFile;
                        });
                        depFiles.forEach(function (path) {
                            watcher.add(path);
                        });

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

                        sourceMapData.sources = sourceMapData.sources.map(function (source) {
                            sourceMapData.sourcesContent.push(fs.readFileSync(source, {encoding: 'utf-8'}));
                            return path.relative(node.base, source);
                        });
                        outputNode.metadata.sourceMap = outputNode.siblings.length;
                        outputNode.siblings.push({
                            name: outputNode.name + '.map',
                            data: new Buffer(JSON.stringify(sourceMapData), 'utf-8')
                        });

                        css = css.replace('#SOURCE_MAP#', './' + path.basename(outputNode.name) + '.map');
                        outputNode.data = new Buffer(css, 'utf8');

                        sink.push(new mix.Tree([outputNode]));

                        mix.log('sass', 'Compiled ' + outputNode.name, new Date() - start);
                    },
                    error: function (error) {
                        if (disposed) {
                            return;
                        }
                        mix.error('sass', error);
                    }
                }));
            }

            return function dispose() {
                watcher.dispose();
                disposed = true;
            };
        });
    };
};
