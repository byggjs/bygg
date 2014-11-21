#!/usr/bin/env node

'use strict';

var Liftoff = require('liftoff');
var nomnom = require('nomnom');

var cli = new Liftoff({
    name: 'mix',
    moduleName: 'mix',
    configName: 'mixfile',
    extensions: { '.js': null }
});

cli.launch({}, function (env) {
    require(env.configPath);
    nomnom.nom();
});
