'use strict';

var bygglib = require('../lib');

module.exports = function () {
    return function (tree) {
        return bygglib.signal(tree);
    };
};
