'use strict';

var Kefir = require('kefir');
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

module.exports = {
    combine: combine,
    Stream: Stream,
    Tree: Tree,
    Watcher: Watcher
};
