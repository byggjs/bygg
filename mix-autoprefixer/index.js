'use strict';

var autoprefixer = require('autoprefixer');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');

var DEFAULT_CONSTRAINTS = ['last 2 versions', 'ie 9'];

module.exports = function () {
    var constraints = arguments.length > 0 ? Array.prototype.slice.call(arguments) : DEFAULT_CONSTRAINTS;

    return function (tree) {
        var start = new Date();
        var nodes = tree.nodes.map(function (node) {
            var input = node.data.toString('utf8');
            var result = autoprefixer.call(constraints).process(input);
            return mixIn({}, node, {
                data: new Buffer(result.css, 'utf8')
            });
        });
        console.log('autoprefixed CSS in ' + (new Date() - start) + ' ms');
        return new mix.Tree(nodes);
    };
};
