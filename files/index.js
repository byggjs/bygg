'use strict';

var mime = require('mime');
var mix = require('mix');
var path = require('path');
var vfs = require('vinyl-fs');

module.exports = function (options) {
    var base = path.resolve(options.base);

    var src;
    if (typeof options.src === 'string') {
        src = [options.src];
    } else {
        src = options.src;
    }

    function nodeFromVinyl(file) {
        return {
            name: path.relative(base, file.path),
            base: base,
            data: file.contents,
            stat: file.stat,
            metadata: {
                mime: mime.lookup(file.path)
            },
            siblings: []
        };
    }

    return new mix.Stream(function (sink) {
        var watcher = new mix.Watcher();
        watcher.on('change', pushNext);

        pushNext();

        function pushNext() {
            readTree(sink.push);
        }

        function readTree(callback) {
            var stream = vfs.src(src, {
                cwd: base
            });
            var files = [];
            stream.on('data', function (file) {
                if (!file.isNull()) {
                    watcher.add(file.path);
                    files.push(file);
                }
            });
            stream.on('end', function () {
                callback(new mix.Tree(files.map(nodeFromVinyl)));
            }.bind(this));
        }

        return function dispose() {
            watcher.dispose();
        };
    });
};
