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
                console.log('package:', file);
                pkgCache[file] = pkg;
            });
            b.on('dep', function (dep) {
                console.log('dep:', dep.id);
                depCache[dep.id] = dep;
                console.log('>>>');
                watcher.add(dep.id);
                console.log('<<<');
                console.log('');
            });
            b.on('file', function (file) {
                console.log('C file:', file);
            });
            b.on('bundle', function (bundle) {
                // console.log('D bundle:', bundle);
                bundle.on('transform', function (transform, mfile) {
                    // console.log('E transform:', transform.constructor, mfile);
                    transform.on('file', function (file) {
                        // console.log('F file:', file);
                    });
                });
            });

            watcher.on('change', function (files) {
                console.log('change!', files);
            });

            b.add(path.join(node.base, node.name));

            var buffers = [];
            var totalLength = 0;
            var output = b.bundle();
            output.on('data', function (buffer) {
                buffers.push(buffer);
                totalLength += buffer.length;
            });
            output.on('end', function () {
                var outputTree = new mix.Tree([
                    mixIn({}, node, { data: Buffer.concat(buffers, totalLength) })
                ]);
                sink.push(outputTree);
            });

            return function dispose() {
                console.log('dispose!');
                watcher.dispose();
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
            return function () {
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
        }).throttle(100).onValue(function (files) {
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
                console.log('scan:', update);
                var operation = update[0];
                var path = update[1];
                if (operation === '+') {
                    changed[path] = true;
                } else {
                    delete changed[path];
                }
                return changed;
            }).throttle(100).onValue(function (changed) {
                console.log('process', changed);
                var files = Object.keys(changed);
                if (files.length > 0) {
                    files.forEach(function (path) {
                        eventSink(['-', path]);
                    });
                    this.emit('change', files);
                }
            }, this);
        }, this);
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
