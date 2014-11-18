'use strict';

var browserify = require('browserify');
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');
var convertSourceMap = require('convert-source-map');

module.exports = function (options) {
    var watcher;
    var pkgCache = {};
    var depCache = {};

    options = options || {};
    var configure = options.configure || function () {};
    delete options.configure;

    return function (tree) {
        if (watcher !== undefined) {
            watcher.close();
        }

        if (tree.nodes.length !== 1) {
            throw new Error('Exactly one file must be specified for browserification');
        }

        var node = tree.nodes[0];
        var entrypoint = path.join(node.base, node.name);
        var signal = mix.signal();
        watcher = mix.watcher();

        delete depCache[entrypoint];

        var bOpts = mixIn({}, options, {
            basedir: node.base,
            packageCache: pkgCache,
            cache: depCache,
            debug: true
        });

        var b = browserify(bOpts);

        configure(b);

        var pushBundle = function () {
            var start = new Date();

            b.bundle(function (err, buf) {
                if (err) { mix.logger.error('browserify', err.message); return; }

                mix.logger.log('browserify', 'Bundled ' + node.name, new Date() - start);
                watcher.watch(Object.keys(depCache).map(function (depId) {
                    return depCache[depId].file;
                }));

                var outputNode = tree.cloneNode(node);
                var outputPrefix = path.dirname(node.name) + '/';
                if (outputPrefix === './') {
                    outputPrefix = '';
                }

                var bundle = buf.toString('utf-8');

                // Bundle
                var outputBundle = convertSourceMap.removeComments(bundle);
                outputBundle += '\n//# sourceMappingURL=./' + path.basename(outputNode.name) + '.map';
                outputNode.name = outputPrefix + path.basename(node.name, path.extname(node.name)) + '.js';
                outputNode.metadata.mime = 'application/javascript';
                outputNode.data = new Buffer(outputBundle, 'utf-8');

                // Source map
                var sourceMap = convertSourceMap.fromSource(bundle);
                var sourcePrefix = path.resolve(node.base, outputPrefix);
                sourceMap.setProperty('sources', sourceMap.getProperty('sources').map(function (source){
                    return source[0] === '/' ?
                        path.relative(sourcePrefix, source) :
                        path.relative(outputPrefix, source);
                }));
                outputNode.metadata.sourceMap = outputNode.siblings.length;
                outputNode.siblings.push({
                    name: outputNode.name + '.map',
                    data: new Buffer(sourceMap.toJSON(), 'utf-8'),
                    stat: node.stat
                });

                signal.push(mix.tree([outputNode]));
            });
        };

        b.on('package', function (file, pkg) {
            pkgCache[file] = pkg;
        });

        b.on('dep', function (dep) {
            if (dep.file !== entrypoint) {
                depCache[dep.id] = dep;
            }
        });

        watcher.listen(function (paths) {
            pushBundle();
        });

        b.add(entrypoint);

        pushBundle();

        return signal;
    };
};
