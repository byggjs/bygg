'use strict';

var Kefir = require('kefir');
var chalk = require('chalk');
var notifier = require('node-notifier');

var Stream = require('./lib/stream');
var Tree = require('./lib/tree');
var Watcher = require('./lib/watcher');

function combine() {
    var streams = Array.prototype.slice.call(arguments);
    streams.forEach(function (stream) {
        stream._consumers++;
    });
    var observables = streams.map(function (stream) { return stream._observable; });
    return new Stream(Kefir.combine(observables, Tree.merge));
}

function log (plugin, message, time) {
    var loggedTime = (time !== undefined) ? chalk.yellow('(' + time + 'ms)') : '';
    console.log(chalk.green('[' + plugin + ']'), message, loggedTime);
}

function error (plugin, message) {
    console.log(chalk.red('[' + plugin + ']'), message);
    notifier.notify({
        title: plugin + ' error',
        message: message
    });
}

module.exports = {
    log: log,
    error: error,
    combine: combine,
    Stream: Stream,
    Tree: Tree,
    Watcher: Watcher
};
