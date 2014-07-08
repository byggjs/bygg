var Kefir = require('kefir');
var browserify = require('browserify');
var dummy = require('./lib/transforms/dummy');
var minIn = require('mout/object/mixIn');
var mix = require('mix');

module.exports = function (options) {
    var b = null;

    return function (tree) {
        var node = tree.nodes[0];

        if (b === null) {
            b = browserify(mixIn({}, options, { basedir: node.base }));
            b.add(node.name);
            console.log('b:', b);
        }

        // TODO
        return tree;
    };
};
