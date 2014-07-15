'use strict';

var browserify = require('browserify');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

var SOURCEMAPPINGURL_PREFIX = '\n//# sourceMappingURL=data:application/json;base64,';

module.exports = function (options) {
    var currentSink = null;
    var pkgCache = {};
    var depCache = {};
    var upToDate = {};
    var changedNodes = {};
    var changedEventSink = null;
    var firstPush = true;

    options = options || {};

    var configure = options.configure || function () {};
    delete options.configure;

    var changed = new mix.Stream(function (sink) {
        changedEventSink = sink;
    });

    function processTree(tree) {
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
                var node = tree.findNode(function (name, base) {
                    return dep.id.indexOf(base) === 0;
                });
                if (node !== null && !upToDate[dep.id]) {
                    upToDate[dep.id] = true;
                    var depNode = tree.cloneNode(node);
                    depNode.name = path.relative(node.base, dep.id);
                    depNode.data = new Buffer(dep.source, 'utf8');
                    changedNodes[depNode.name] = depNode;
                }

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
                    delete upToDate[path];
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
                    packageCache: pkgCache,
                    debug: true
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
                output.on('error', function (error) {
                    console.log(error);
                });
                output.on('end', function () {
                    if (disposed) {
                        return;
                    }

                    console.log('generated JS in ' + (new Date() - start) + ' ms');

                    firstPush = false;

                    var sourceMapData = null;
                    var sourceMapBufferIndex = buffers.length;
                    var sourceMapTrailerSize = 0;
                    for (var i = buffers.length - 1; i >= 0; i--) {
                        var buffer = buffers[i];
                        sourceMapTrailerSize += buffer.length;
                        var source = buffer.toString('utf8');
                        if (source.substr(0, SOURCEMAPPINGURL_PREFIX.length) === SOURCEMAPPINGURL_PREFIX) {
                            var originalSourceMap = JSON.parse(new Buffer(source.substr(SOURCEMAPPINGURL_PREFIX.length), 'base64').toString('utf8'));
                            var modifiedSourceMap = fixupSourceMap(originalSourceMap);
                            sourceMapData = new Buffer(JSON.stringify(modifiedSourceMap), 'utf8');
                            sourceMapBufferIndex = i;
                            break;
                        }
                    }

                    if (sourceMapData !== null) {
                        totalLength -= sourceMapTrailerSize;
                    }

                    var outputNode = tree.cloneNode(node);
                    outputNode.name = path.dirname(node.name) + '/' + path.basename(node.name, path.extname(node.name)) + '.js';
                    outputNode.data = Buffer.concat(buffers.slice(0, sourceMapBufferIndex), totalLength);
                    outputNode.metadata.mime = 'application/javascript';
                    if (sourceMapData !== null) {
                        var sourceMapUrlTrailer = '\n//# sourceMappingURL=./' + path.basename(outputNode.name) + '.map';
                        outputNode.data = Buffer.concat([outputNode.data, new Buffer(sourceMapUrlTrailer, 'utf8')]);
                        outputNode.metadata.sourceMap = outputNode.siblings.length;
                        outputNode.siblings.push({
                            name: outputNode.name + '.map',
                            data: sourceMapData,
                            stat: node.stat
                        });
                    }

                    var outputTree = new mix.Tree([outputNode]);
                    sink.push(outputTree);

                    var nodes = [];
                    Object.keys(changedNodes).forEach(function (name) {
                        nodes.push(changedNodes[name]);
                    });
                    changedNodes = {};
                    if (nodes.length > 0) {
                        changedEventSink.push(new mix.Tree(nodes));
                    }
                });
            }

            function fixupSourceMap(sourceMap) {
                var result = mixIn({}, sourceMap);
                result.sources = sourceMap.sources.map(function (source) {
                    return path.relative(node.base, source);
                });
                return result;
            }

            return function dispose() {
                watcher.dispose();
                disposed = true;
            };
        });
    };

    Object.defineProperty(processTree, 'changed', { value: changed });

    return processTree;
};
