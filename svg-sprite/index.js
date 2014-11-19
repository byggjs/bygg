'use strict';

var path = require('path');
var mix = require('mix');

var SVG_WRAPPER = '<svg xmlns="http://www.w3.org/2000/svg">#shapes#</svg>';

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var symbols = tree.nodes.reduce(function (acc, node) {
            var name = path.basename(node.name, '.svg');
            var shape = node.data.toString('UTF-8');

            var viewBox = /(viewBox="[^"]+")/.exec(shape)[1];

            // Strip doctype and svg element
            shape = shape.replace(/<?xml[^>]>/g, '');
            shape = shape.replace(/<svg[^>]+>|<\/svg>/g, '');

            shape = '<symbol ' + viewBox + ' id="' + name + '">' + shape + '</symbol>';

            // Remove fill attributes, in order to be able to style from CSS
            if (options.preserveFill.indexOf(name) === -1) {
                shape = shape.replace(/\s*(?:fill|fill-opacity)="[^"]+"/g, '');
            }

            return acc + shape;
        }, '');

        var sprite = SVG_WRAPPER.replace('#shapes#', symbols);
        var fileName = options.dest || 'svg-sprite.svg';

        return mix.tree([{
            base: path.dirname(fileName),
            name: fileName,
            data: new Buffer(sprite, 'utf8'),
            metadata: {
                mime: 'image/svg+xml'
            },
            siblings: []
        }]);
    };
};
