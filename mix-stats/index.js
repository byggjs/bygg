'use strict';

module.exports = function () {
    return function (tree) {
        tree.nodes.forEach(function (node) {
            console.log(node.name + ': ' + node.data.length + ' bytes');
        });
        return tree;
    };
};
