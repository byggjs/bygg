'use strict';

var nomnom = require('nomnom');

var signal = require('./lib/signal');
var tree = require('./lib/tree');

var task = function (name, callback) {
    var command = nomnom
        .command(name)
        .callback(function (opts) {
            callback.call(null, opts.optimize);
        });
};

var combine = function (/* ...signals */) {
    var args = Array.prototype.slice.call(arguments);
    var combinator = tree.merge;
    args.unshift(combinator);
    return signal.combine.apply(null, args);
};

module.exports = {
    task: task,
    combine: combine,
    files: require('./base/files'),
    write: require('./base/write'),
    noop: require('./base/noop')
};
