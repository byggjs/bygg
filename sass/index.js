'use strict';

var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');
var sass = require('node-sass');

module.exports = function (options) {
    var sinks = [];

    return function (tree) {
        sinks.forEach(function (sink) {
            sink.close();
        });
        sinks = [];

        var streams = tree.nodes.map(function (node) {
            return new mix.Stream(function (sink) {
                sinks.push(sink);

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

                            console.log('generated CSS in ' + (new Date() - start) + ' ms');

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

                            console.log(error);
                        },
                        stats: stats
                    }));
                }

                return function dispose() {
                    watcher.dispose();
                    disposed = true;
                };
            });
        });

        return mix.combine.apply(null, streams);
    };
};
