'use strict';

var signal = require('./lib/signal');
var tree = require('./lib/tree');

var combineTrees = function (/* ...signals */) {
    var args = Array.prototype.slice.call(arguments);
    var combinator = tree.merge;
    args.unshift(combinator);
    return signal.combine.apply(null, args);
};

module.exports = {
    combine: combineTrees
};
