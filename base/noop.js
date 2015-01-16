'use strict';

var mixlib = require('../lib');

module.exports = function () {
    return function (tree) {
        return mixlib.signal(tree);
    };
};
