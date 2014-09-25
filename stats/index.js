'use strict';

// Based on gulp-size by @sindresorhus
var mix = require('mix');
var chalk = require('chalk');
var gzipSize = require('gzip-size');
var mixIn = require('mout/object/mixIn');
var prettyBytes = require('pretty-bytes');

module.exports = function (options) {
    options = mixIn({
        showFiles: true
    }, options || {});

    return function (tree) {
        var result = [];
        var rawTotalSize = 0;
        var gzTotalSize = 0;
        var remaining = tree.nodes.length;

        mix.log('stats', '');
        tree.nodes.forEach(function (node, i) {
            result.push(null);

            gzipSize(node.data, function (err, gzSize) {
                result[i] = { name: node.name, rawSize: node.data.length, gzSize: gzSize };

                rawTotalSize += node.data.length;
                gzTotalSize += gzSize;
                if (--remaining === 0) {
                    result.forEach(function (file) {
                        if (options.showFiles === true && file.rawSize > 0) {
                            log(options.title, chalk.blue(file.name), file.rawSize, file.gzSize);
                        }
                    });
                    if (result.length !== 1 || !options.showFiles || rawTotalSize === 0) {
                        log(options.title, chalk.green('total'), rawTotalSize, gzTotalSize);
                    }
                }
            });
        });

        return tree;
    };
};

function log(title, what, rawSize, gzSize) {
    title = title ? ('\'' + chalk.cyan(title) + '\' ') : '';
    console.log(title + what + ' ' + chalk.gray(prettyBytes(rawSize)) +
        chalk.magenta(' (' + prettyBytes(gzSize) + ' gzipped)'));
}
