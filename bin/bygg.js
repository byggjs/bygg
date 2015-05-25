#!/usr/bin/env node

'use strict';

var Liftoff = require('liftoff');
var nomnom = require('nomnom');

var logger = require('../lib/logger');

var cli = new Liftoff({
    name: 'bygg',
    moduleName: 'bygg',
    configName: 'byggfile',
    processTitle: 'bygg',
    extensions: { '.js': null }
});

cli.launch({}, function (env) {
    if (!env.configPath) {
        logger.error('bygg', 'No byggfile found');
        process.exit(1);
    }
    require(env.configPath);

    nomnom.nom();
});
