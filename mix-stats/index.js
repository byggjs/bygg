'use strict';

// Based on gulp-size by @sindresorhus

var chalk = require('chalk');
var gzipSize = require('gzip-size');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var prettyBytes = require('pretty-bytes');

module.exports = function (options) {
    options = mixIn({
        showFiles: true,
        gzip: true
    }, options || {});

    return function (tree) {
        return new mix.Stream(function (sink) {
            var result = [];
            var totalSize = 0;
            var remaining = tree.nodes.length;

            tree.nodes.forEach(function (node, i) {
                result.push(null);

                function finish(err, size) {
                    result[i] = { name: node.name, size: size };

                    totalSize += size;

                    if (--remaining === 0) {
                        result.forEach(function (file) {
                            if (options.showFiles === true && file.size > 0) {
                                log(options.title, chalk.blue(file.name), file.size, options.gzip);
                            }
                        });
                        if (result.length !== 1 || !options.showFiles || totalSize === 0) {
                            log(options.title, chalk.green('total'), totalSize, options.gzip);
                        }
                        sink.close(tree);
                    }
                }

                if (options.gzip) {
                    gzipSize(node.data, finish);
                } else {
                    finish(null, node.data.length);
                }
            });
        });
    };
};

function log(title, what, size, gzip) {
    title = title ? ('\'' + chalk.cyan(title) + '\' ') : '';
    console.log(title + what + ' ' + chalk.magenta(prettyBytes(size)) +
        (gzip ? chalk.gray(' (gzipped)') : ''));
}
