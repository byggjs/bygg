'use strict';

var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');
var sass = require('node-sass');

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
                    success: function (css) {
                        if (disposed) {
                            return;
                        }

                        mix.log('sass', 'Compiled ' + node.name, new Date() - start);

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
                        outputNode.data = new Buffer(css, 'utf8');
                        outputNode.metadata.mime = 'text/css';
                        sink.push(new mix.Tree([outputNode]));
                    },
                    error: function (error) {
                        if (disposed) {
                            return;
                        }
                        mix.error('sass', error);
                    },
                    stats: stats
                }));
            }

            return function dispose() {
                watcher.dispose();
                disposed = true;
            };
        });
    };
};
