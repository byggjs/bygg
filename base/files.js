'use strict';

var mime = require('mime');
var path = require('path');
var vfs = require('vinyl-fs');
var mixlib = require('../lib');

module.exports = function (options) {
    options = (typeof options === 'string') ? { src: options } : options;

    var src = (typeof options.src === 'string') ? [options.src] : options.src;
    var base = options.base !== undefined ? path.resolve(options.base) : process.cwd();

    var watcher = mixlib.watcher();
    var signal = mixlib.signal();

    var nodeFromVinyl = function (file) {
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
    };

    var pushNext = function () {
        var stream = vfs.src(src, { cwd: base });
        var files = [];

        stream.on('data', function (file) {
            if (!file.isNull()) {
                files.push(file);
            }
        });

        stream.on('end', function () {
            watcher.watch(files.map(function (file) { return file.path; }));
            signal.push(mixlib.tree(files.map(nodeFromVinyl)));
        });
    };

    watcher.listen(pushNext);

    pushNext();

    return signal;
};
