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

                        console.log('generated CSS in ' + (new Date() - start) + ' ms');

                        depFiles = stats.includedFiles.filter(function (path) {
                            return path !== sassFile;
                        });
                        depFiles.forEach(function (path) {
                            watcher.add(path);
                        });

                        var target = path.dirname(node.name) + '/' + path.basename(node.name, path.extname(node.name)) + '.css';
                        var outputTree = new mix.Tree([
                            mixIn({}, node, {
                                name: target,
                                data: new Buffer(css, 'utf8')
                            })
                        ]);
                        sink.push(outputTree);
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
    };
};
