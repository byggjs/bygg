#!/usr/bin/env node

'use strict';

var Liftoff = require('liftoff');
var nomnom = require('nomnom');

var logger = require('../lib/logger')

var cli = new Liftoff({
    name: 'mix',
    moduleName: 'mix',
    configName: 'mixfile',
    processTitle: 'mix',
    extensions: { '.js': null }
});

cli.launch({}, function (env) {
    if (!env.configPath) {
        logger.error('mix', 'No mixfile found');
        process.exit(1);
    }
    require(env.configPath);

    nomnom.nom();
});
