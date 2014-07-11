'use strict';

var crypto = require('crypto');
var mix = require('mix');
var path = require('path');

module.exports = function (options) {
    options = options || {};

    var entrypoint = options.entrypoint || 'index.html';

    return function (tree) {
        var deps = resolveDependencies(tree.nodes);

        var nodeMap = deps.reduce(function (nodeMap, dep) {
            var contents = dep.node.data.toString('utf8');
            Object.keys(dep.refs).forEach(function (reference) {
                var referencedNode = dep.refs[reference];
                contents = contents.replace(new RegExp(reference, 'g'), replacement(reference, nodeMap[referencedNode.name]));
            });
            var name = dep.node.name;
            var data = new Buffer(contents, 'utf8');
            var revision = md5(data).substr(0, 8);
            var extension = path.extname(name);
            var revName = (name !== entrypoint) ? joinPath(dirName(name), path.basename(name, extension) + '-' + revision + extension) : name;
            var revNode = dep.siblingOf === null ? tree.cloneNode(dep.node) : tree.cloneSibling(dep.node, dep.siblingOf);
            revNode.name = revName;
            revNode.data = data;
            nodeMap[name] = revNode;
            return nodeMap;
        }, {});

        var nodes = deps.reduce(function (nodes, dep) {
            var revNode = nodeMap[dep.node.name];
            if (dep.siblingOf) {
                var toplevel = nodeMap[dep.siblingOf.name];
                toplevel.siblings = toplevel.siblings.map(function (sibling) {
                    if (sibling === dep.node) {
                        return revNode;
                    } else {
                        return sibling;
                    }
                });
            } else {
                nodes.push(revNode);
            }
            return nodes;
        }, []);

        return new mix.Tree(nodes);
    };
};

function resolveDependencies(nodes, nodeMap, stack) {
    var deps = [];

    if (typeof nodeMap === 'undefined') {
        nodeMap = nodes.reduce(function (map, node) {
            map[node.name] = {
                node: node,
                siblingOf: null
            };
            node.siblings.forEach(function (sibling) {
                map[sibling.name] = {
                    node: sibling,
                    siblingOf: node
                };
            });
            return map;
        }, {});
    }

    stack = stack || [];

    forEachNode.call(nodes, function (node) {
        if (stack.indexOf(node) !== -1) {
            return;
        }
        stack.push(node);

        var refs = {};
        var siblingOf = nodeMap[node.name].siblingOf;
        if (siblingOf === null) {
            var contents = node.data.toString('utf8');
            var filepathRegex = /(?:\'|\"|\(|\/\/# sourceMappingURL=)([a-z0-9_@\-\/\.]{2,})/ig;
            var match;
            while ((match = filepathRegex.exec(contents))) {
                var reference = match[1];

                var referencedPath;
                if (reference.indexOf('/') === 0) {
                    referencedPath = reference.substr(1);
                } else {
                    referencedPath = joinPath(dirName(node.name), reference);
                }
                var referencedEntry = nodeMap[referencedPath] || null;
                if (referencedEntry !== null) {
                    refs[reference] = referencedEntry.node;
                    Array.prototype.push.apply(deps, resolveDependencies([referencedEntry.node], nodeMap, stack));
                }
            }
        }

        deps.push({
            node: node,
            siblingOf: siblingOf,
            refs: refs
        });
    });

    return deps;
}

function replacement(reference, referencedNode) {
    return joinPath(dirName(reference), path.basename(referencedNode.name));
}

function forEachNode(callback) {
    Array.prototype.forEach.call(this, function (node) {
        callback(node, null);
        if (node.siblings) {
            node.siblings.forEach(function (sibling) {
                callback(sibling, node);
            });
        }
    });
}

function dirName(directory) {
    return path.dirname(directory).replace(/\\/g, '/');
}

function joinPath(directory, filename) {
    return path.join(directory, filename).replace(/\\/g, '/');
}

function md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}
