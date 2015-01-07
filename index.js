'use strict';

var nomnom = require('nomnom');

var signal = require('./lib/signal');
var tree = require('./lib/tree');

var task = function (name, callback, options) {
    options = options || [];

    var command = nomnom.command(name);

    options.forEach(function (option) {
        command = command.option(option.name, {
            abbr: option.abbr,
            flag: option.flag,
            default: option.default
        });
    });

    command.callback(function (opts) {
        var args = options.map(function (option) {
            return opts[option.name];
        });
        callback.apply(null, args);
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
