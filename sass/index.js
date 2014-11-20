'use strict';

var mixIn = require('mout/object/mixIn');
var path = require('path');
var sass = require('node-sass');
var fs = require('fs');
var mixlib = require('../lib');

module.exports = function (options) {
    var watcher;

    return function (tree) {
        if (watcher !== undefined) {
            watcher.close();
        }

        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one scss file must be specified');
        }

        var node = tree.nodes[0];
        var signal = mixlib.signal();
        watcher = mixlib.watcher();
        var deps = [];

        var pushCss = function () {
            var sassFile = path.join(node.base, node.name);
            var stats = {};
            var start = new Date();

            sass.render(mixIn({}, options, {
                file: sassFile,
                stats: stats,
                sourceMap: '_.map',
                omitSourceMapUrl: true,
                success: function (css) {
                    deps = stats.includedFiles.filter(function (path) {
                        return path !== sassFile;
                    });
                    watcher.watch(deps);

                    var outputNode = tree.cloneNode(node);
                    var outputPrefix = path.dirname(node.name) + '/';
                    if (outputPrefix === './') {
                        outputPrefix = '';
                    }
                    outputNode.name = outputPrefix + path.basename(node.name, path.extname(node.name)) + '.css';
                    outputNode.metadata.mime = 'text/css';
                    outputNode.data = new Buffer(css, 'utf8');

                    var sourceMap = JSON.parse(stats.sourceMap);
                    mixlib.tree.sourceMap.set(outputNode, sourceMap, { sourceBase: path.join(node.base, outputPrefix) });

                    mixlib.logger.log('sass', 'Compiled ' + outputNode.name, new Date() - start);

                    signal.push(mixlib.tree([outputNode]));
                },
                error: function (error) {
                    mixlib.logger.error('sass', error);
                }
            }));
        };

        watcher.listen(function (paths) {
            pushCss();
        });

        pushCss();

        return signal;
    };
};
