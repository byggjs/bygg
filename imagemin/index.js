'use strict';

var Imagemin = require('imagemin');
var pluck = require('mout/collection/pluck');
var mixlib = require('../lib');

module.exports = function (options) {
    options = options || {};

    return function (tree) {
        var signal = mixlib.signal();
        var nodes = [];
        var processed = 0;

        tree.nodes.forEach(function (node, index) {
            new Imagemin()
                .use(Imagemin.gifsicle({ interlaced: options.interlaced }))
                .use(Imagemin.jpegtran({ progressive: options.progressive }))
                .use(Imagemin.optipng({ optimizationLevel: options.optimizationLevel }))
                .use(Imagemin.svgo({ plugins: options.svgoPlugins || [] }))
                .src(node.data)
                .run(function(err, result) {
                    if (err) {
                        processed++;
                        mixlib.logger.error('imagemin', err);
                        return;
                    }

                    var outputNode = tree.cloneNode(node);
                    outputNode.data = result[0].contents;
                    nodes.push(outputNode);
                    processed++;

                    if (processed === tree.nodes.length) {
                        mixlib.logger.log('imagemin', 'Minified ' + tree.nodes.length + ' images');
                        signal.push(mixlib.tree(nodes));
                    }
                });
        });

        return signal;
    };
};
