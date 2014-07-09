var browserify = require('browserify');
var dummy = require('./lib/transforms/dummy');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

module.exports = function (options) {
    var b = null;
    var entrypoint = null;

    return function (tree) {
        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one file must be specified for browserification');
        }

        var node = tree.nodes[0];

        if (node.name !== entrypoint) {
            entrypoint = node.name;

            b = browserify(mixIn({}, options, { basedir: node.base }));

            b.on('package', function (file, pkg) {
                // console.log('A package:', file, pkg.name);
            });
            b.on('dep', function (dep) {
                // console.log('B dep:', dep);
            });
            b.on('file', function (file) {
                // console.log('C file:', file);
            });
            b.on('bundle', function (bundle) {
                // console.log('D bundle:', bundle);
                bundle.on('transform', function (transform, mfile) {
                    // console.log('E transform:', transform.constructor, mfile);
                    transform.on('file', function (file) {
                        // console.log('F file:', file);
                    });
                });
            });

            b.add(path.join(node.base, entrypoint));
        }

        return new mix.Stream(function (sink) {
            var buffers = [];
            var totalLength = 0;
            var output = b.bundle();
            output.on('data', function (buffer) {
                buffers.push(buffer);
                totalLength += buffer.length;
            });
            output.on('end', function () {
                var outputTree = new mix.Tree([
                    mixIn({}, node, { data: Buffer.concat(buffers, totalLength) })
                ]);
                sink.close(outputTree);
            });
        });
    };
};
