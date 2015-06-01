'use strict';

var chokidar = require('chokidar');
var signal = require('./signal');

var Watcher = function () {
    var output = signal();
    var pending = [];
    var debounceId;
    var watcher = chokidar.watch([], { persistent: false, useFsEvents: false });
    var watched = [];

    watcher.on('change', function (path) {
        if (pending.indexOf(path) === -1) {
            pending.push(path);
            debouncedEmit();
        }
    });

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
        watcher.add(paths);
    };

    this.close = function () {
        if (watcher !== undefined) {
            watcher.close();
        }
    };
};

Watcher.create = function () {
    return new Watcher();
};

module.exports = Watcher.create;
