var File = require('vinyl');
var mix = require('mix');
var path = require('path');
var rimraf = require('rimraf');
var vfs = require('vinyl-fs');

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
        return new File({
            cwd: node.base,
            base: node.base,
            path: path.join(node.base, node.name),
            stat: node.stat,
            contents: node.data
        });
    }

    return function (tree) {
        return new mix.Stream(function (sink) {
            schedule(function (done) {
                rimraf(dir, function (error) {
                    if (!error) {
                        var stream = vfs.dest(dir);
                        tree.nodes.map(nodeToVinyl).forEach(function (file) {
                            stream.write(file);
                        });
                        stream.end();
                        console.log('TODO');
                    } else {
                        console.log(error);
                        sink.close();
                        done();
                    }
                });
            });
        });
    }
};
