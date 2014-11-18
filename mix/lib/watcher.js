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

    this.listen = output.listen.bind(output);

    this.watch = function (paths) {
        this.close();

        watcher = chokidar.watch(paths);

        watcher.on('change', function (path) {
            if (pending.indexOf(path) === -1) {
                pending.push(path);
                debouncedEmit();
            }
        }.bind(this));
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
