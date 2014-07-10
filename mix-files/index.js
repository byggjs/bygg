var mix = require('mix');
var path = require('path');
var vfs = require('vinyl-fs');

module.exports = function (options) {
    var base = path.resolve(options.base);

    var globs;
    if (typeof options.globs === 'string') {
        globs = [options.globs];
    } else {
        globs = options.globs;
    }
    globs = globs.map(function (g) { return path.join(base, g) });

    function fileToNode(file) {
        return {
            name: path.relative(base, file.path),
            base: base,
            data: file.contents,
            mode: file.stat.mode
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
            var stream = vfs.src(globs, {
                base: base
            });
            var files = [];
            stream.on('data', function (file) {
                watcher.add(file.path);
                files.push(file);
            });
            stream.on('end', function () {
                callback(new mix.Tree(files.map(fileToNode)));
            }.bind(this));
        }

        return function dispose() {
            watcher.dispose();
        };
    });
};
