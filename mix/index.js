'use strict';

var mixIn = require('mout/object/mixIn');

var signal = require('./lib/signal');
var tree = require('./lib/tree');
var watcher = require('./lib/watcher');
var logger = require('./lib/logger');

var combineTrees = function (/* ...signals */) {
    var args = Array.prototype.slice.call(arguments);
    var combinator = tree.merge;
    args.unshift(combinator);
    return signal.combine.apply(null, args);
};

module.exports = {
    combine: combineTrees,
    logger: logger,
    signal: signal,
    watcher: watcher,
    tree: tree
};
