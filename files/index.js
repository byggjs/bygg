'use strict';

var mime = require('mime');
var mix = require('mix');
var path = require('path');
var vfs = require('vinyl-fs');

module.exports = function (options) {
    var base = path.resolve(options.base);
    var src = (typeof options.src === 'string') ? [options.src] : options.src;

    var watcher = mix.watcher();
    var signal = mix.signal();

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
            signal.push(mix.tree(files.map(nodeFromVinyl)));
        });
    };

    watcher.listen(pushNext);

    pushNext();

    return signal;
};
