var browserify = require('browserify');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

module.exports = function (options) {
    var currentSink = null;
    var pkgCache = {};
    var depCache = {};
    var firstPush = true;

    options = options || {};

    var configure = options.configure || function () {};
    delete options.configure;

    return function (tree) {
        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one file must be specified for browserification');
        }
        var node = tree.nodes[0];
        var entrypoint = path.join(node.base, node.name);

        delete depCache[entrypoint];

        if (currentSink !== null) {
            currentSink.close();
            currentSink = null;
        }

        return new mix.Stream(function (sink) {
            currentSink = sink;

            var disposed = false;
            var watcher = new mix.Watcher();

            var b = browserify(mixIn({}, options, { basedir: node.base }));

            configure(b);

            b.on('package', function (file, pkg) {
                pkgCache[file] = pkg;
            });
            b.on('dep', function (dep) {
                depCache[dep.id] = dep;
                if (dep.id !== entrypoint) {
                    watcher.add(dep.id);
                }
            });
            b.on('file', function (file) {
                if (file !== entrypoint) {
                    watcher.add(file);
                }
            });
            b.on('bundle', function (bundle) {
                bundle.on('transform', function (transform, mfile) {
                    transform.on('file', function (file) {
                        // TODO: handle file change
                    });
                });
            });

            watcher.on('change', function (files) {
                if (disposed) {
                    return;
                }

                files.forEach(function (path) {
                    delete depCache[path];
                    watcher.remove(path);
                });
                pushBundle();
            });

            b.add(entrypoint);

            pushBundle();

            function pushBundle() {
                var buffers = [];
                var totalLength = 0;
                var bundleOptions = {
                    includePackage: true,
                    packageCache: pkgCache
                };
                if (!firstPush) {
                    bundleOptions.cache = depCache;
                }
                var start = new Date();
                var output = b.bundle(bundleOptions);
                output.on('data', function (buffer) {
                    buffers.push(buffer);
                    totalLength += buffer.length;
                });
                output.on('error', function () {
                    // TODO: handle
                });
                output.on('end', function () {
                    if (disposed) {
                        return;
                    }

                    firstPush = false;

                    var target = path.dirname(node.name) + '/' + path.basename(node.name, path.extname(node.name)) + '.js';
                    var outputTree = new mix.Tree([
                        mixIn({}, node, {
                            name: target,
                            data: Buffer.concat(buffers, totalLength)
                        })
                    ]);
                    sink.push(outputTree);

                    console.log('generated bundle in ' + (new Date() - start) + ' ms');
                });
            }

            return function dispose() {
                watcher.dispose();
                disposed = true;
            };
        });
    };
};
