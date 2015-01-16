'use strict';

var File = require('vinyl');
var path = require('path');
var rimraf = require('rimraf');
var vfs = require('vinyl-fs');
var mixlib = require('../lib');

module.exports = function (dir) {
    var pending = [];

    function schedule(work) {
        pending.push(work);
        if (pending.length === 1) {
            performNext();
        }
    }

    function performNext() {
        var work = pending[0];
        work(function () {
            pending.splice(0, 1);
            if (pending.length > 0) {
                performNext();
            }
        });
    }

    function nodeToVinyl(node) {
        return [
            new File({
                cwd: node.base,
                base: node.base,
                path: path.join(node.base, node.name),
                stat: node.stat,
                contents: node.data
            })
        ].concat(node.siblings.map(function (sibling) {
            return new File({
                cwd: node.base,
                base: node.base,
                path: path.join(node.base, sibling.name),
                stat: sibling.stat,
                contents: sibling.data
            });
        }));
    }

    return function (tree) {
        var output = mixlib.signal();

        schedule(function (done) {
            rimraf(dir, function (error) {
                if (error) {
                    mixlib.logger.error('write', error);
                    done();
                }

                var stream = vfs.dest(dir);
                tree.nodes.map(nodeToVinyl).forEach(function (files) {
                    files.forEach(function (file) {
                        stream.write(file);
                    });
                });
                stream.end();
                stream.on('finish', function () {
                    output.push(tree);
                    done();
                });
                stream.on('error', function (error) {
                    mixlib.logger.error('write', error);
                    done();
                });
            });
        });

        return output;
    };
};
