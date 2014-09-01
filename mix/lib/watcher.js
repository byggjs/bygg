'use strict';

var Emitter = require('prime/emitter');
var Kefir = require('kefir');
var chokidar = require('chokidar');
var debounce = require('./debounce');
var mixIn = require('mout/object/mixIn');
var prime = require('prime');

module.exports = prime({
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
            var result = mixIn({}, files);
            var operation = update[0];
            var path = update[1];
            if (operation === '+') {
                result[path] = true;
            } else {
                delete result[path];
            }
            return result;
        }).flatMap(debounce(600)).skipDuplicates(function (previous, next) {
            return filesToString(previous) === filesToString(next);
        }).onValue(function (files) {
            if (eventSink !== null) {
                eventSink(Kefir.END);
            }
            if (watcher !== null) {
                watcher.close();
                watcher = null;
            }
            var filePaths = Object.keys(files);
            if (filePaths.length === 0) {
                return;
            }
            watcher = chokidar.watch(filePaths, {
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
