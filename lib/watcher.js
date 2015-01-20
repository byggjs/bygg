'use strict';

var chokidar = require('chokidar');
var debounce = require('mout/function/debounce');
var mixIn = require('mout/object/mixIn');

var signal = require('./signal');

var Watcher = function () {
    var output = signal();
    var watcher;
    var pending = [];

    var debouncedEmit = debounce(function () {
        output.push(pending);
        pending = [];
    }.bind(this), 600);

    this.listen = output.map.bind(output);

    this.watch = function (paths) {
        if (watcher !== undefined) {
            watcher.close();
        }

        watcher = chokidar.watch(paths, { persistent: false, useFsEvents: false });
        watcher.on('raw', function (event, path, details) {
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
