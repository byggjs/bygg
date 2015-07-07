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

var argv = nomnom
    .option('optimize', { abbr: 'o', flag: true })
    .nom();

cli.launch({
    cwd: argv.cwd,
    configPath: argv.byggfile
}, function (env) {
    if (!env.configPath) {
        logger.error('bygg', 'No byggfile found');
        process.exit(1);
    }

    if (process.cwd() !== env.cwd) {
        process.chdir(env.cwd);
    }

    require(env.configPath);

    nomnom.nom();
});
