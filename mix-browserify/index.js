var prime = require('prime');
var Emitter = require('prime/emitter');
var Kefir = require('kefir');
var browserify = require('browserify');
var chokidar = require('chokidar');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

module.exports = function (options) {
    var currentSink = null;
    var pkgCache = {};
    var depCache = {};
    var firstPush = true;

    return function (tree) {
        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one file must be specified for browserification');
        }
        var node = tree.nodes[0];

        if (currentSink !== null) {
            currentSink.close();
            currentSink = null;
        }

        return new mix.Stream(function (sink) {
            currentSink = sink;

            var watcher = new Watcher();

            var b = browserify(mixIn({}, options, { basedir: node.base }));

            b.on('package', function (file, pkg) {
                pkgCache[file] = pkg;
            });
            b.on('dep', function (dep) {
                depCache[dep.id] = dep;
                watcher.add(dep.id);
            });
            b.on('file', function (file) {
                watcher.add(file);
            });
            b.on('bundle', function (bundle) {
                bundle.on('transform', function (transform, mfile) {
                    transform.on('file', function (file) {
                        // TODO: handle file change
                    });
                });
            });

            watcher.on('change', function (files) {
                files.forEach(function (path) {
                    delete depCache[path];
                    watcher.remove(path);
                });
                pushBundle();
            });

            b.add(path.join(node.base, node.name));

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
                    if (watcher === null) {
                        return;
                    }

                    var outputTree = new mix.Tree([
                        mixIn({}, node, { data: Buffer.concat(buffers, totalLength) })
                    ]);
                    sink.push(outputTree);
                    console.log('generated bundle in ' + (new Date() - start) + ' ms');
                });
            }

            return function dispose() {
                watcher.dispose();
                watcher = null;
            };
        });
    };
};

var Watcher = prime({
    mixin: Emitter,
    constructor: function () {
        var watcher = null;
        var eventSink = null;

        Kefir.fromBinder(function (sink) {
            this._sink = sink;
            return function dispose() {
                if (watcher !== null) {
                    watcher.close();
                    watcher = null;
                }
                this._sink = null;
            }.bind(this);
        }, this).scan({}, function (files, update) {
            var operation = update[0];
            var path = update[1];
            if (operation === '+') {
                files[path] = true;
            } else {
                delete files[path];
            }
            return files;
        }).flatMap(debounce(600)).skipDuplicates(function (previous, next) {
            return filesToString(previous) === filesToString(next);
        }).onValue(function (files) {
            if (eventSink !== null) {
                eventSink(Kefir.END);
            }
            if (watcher !== null) {
                watcher.close();
            }
            watcher = chokidar.watch(Object.keys(files), {
                persistent: false
            });
            Kefir.fromBinder(function (sink) {
                eventSink = sink;
                watcher.on('change', function (path) {
                    eventSink(['+', path]);
                });
            }).scan({}, function (changed, update) {
                var operation = update[0];
                var path = update[1];
                if (operation === '+') {
                    changed[path] = true;
                } else {
                    delete changed[path];
                }
                return changed;
            }).flatMap(debounce(10, 600)).onValue(function (changed) {
                var files = Object.keys(changed);
                if (files.length > 0) {
                    files.forEach(function (path) {
                        eventSink(['-', path]);
                    });
                    this.emit('change', files);
                }
            }, this);
        }, this);

        function filesToString(files) {
            return Object.keys(files).sort().join(':');
        }
    },
    dispose: function () {
        this._sink(Kefir.END);
    },
    add: function (path) {
        this._sink(['+', path]);
    },
    remove: function (path) {
        this._sink(['-', path]);
    }
});

function debounce(wait, maxWait) {
    var firstValueAt = null;
    var pendingSink = null;

    maxWait = maxWait || wait;

    return function (value) {
        if (pendingSink !== null) {
            pendingSink(Kefir.END);
            pendingSink = null;
        }

        if (firstValueAt === null) {
            firstValueAt = new Date();
        }

        return Kefir.fromBinder(function (sink) {
            var timer;

            pendingSink = sink;

            var now = new Date();
            var elapsed = now - firstValueAt;
            if (elapsed >= maxWait) {
                pushValue();
            } else {
                var delay = Math.min(wait, maxWait - elapsed);
                timer = setTimeout(pushValue, delay);
            }

            function pushValue() {
                timer = null;
                sink(value);
                sink(Kefir.END);
            }

            return function dispose() {
                firstValueAt = null;
                pendingSink = null;

                if (timer !== null) {
                    clearTimeout(timer);
                    timer = null;
                }
            };
        });
    };
}
