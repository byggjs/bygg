'use strict';

var chokidar = require('chokidar');
var signal = require('./signal');

var Watcher = function () {
    var output = signal();
    var watcher;
    var pending = [];
    var debounceId;

    var debouncedEmit = function () {
        if (debounceId !== undefined) {
            clearTimeout(debounceId);
        }
        debounceId = setTimeout(emit, 60);
    };

    var emit = function () {
        output.push(pending);
        pending = [];
    };

    this.listen = output.map.bind(output);

    this.watch = function (paths) {
        if (watcher !== undefined) {
            watcher.close();
        }

        watcher = chokidar.watch(paths, { persistent: false, useFsEvents: false });
        watcher.on('change', function (path) {
            if (pending.indexOf(path) === -1) {
                pending.push(path);
                debouncedEmit();
            }
        });
    };
};

Watcher.create = function () {
    return new Watcher();
};

module.exports = Watcher.create;
