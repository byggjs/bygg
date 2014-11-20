'use strict';

var chalk = require('chalk');
var notifier = require('node-notifier');

function log (plugin, message, time) {
    var loggedTime = (time !== undefined) ? chalk.yellow('(' + time + 'ms)') : '';
    console.log(chalk.green('[' + plugin + ']'), message, loggedTime);
}

function error (plugin, message) {
    console.log(chalk.red('[' + plugin + ']'), message);
    notifier.notify({
        title: plugin + ' error',
        message: message
    });
}

module.exports = { log: log, error: error };
