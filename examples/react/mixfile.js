#!/usr/bin/env node
'use strict';

var autoprefixer = require('mix/autoprefixer');
var browserify = require('mix/browserify');
var files = require('mix/files');
var jshint = require('mix/jshint');
var minifyCss = require('mix/minify-css');
var mix = require('mix');
var rev = require('mix/rev');
var sass = require('mix/sass');
var serve = require('mix/serve');
var stats = require('mix/stats');
var uglify = require('mix/uglify');
var write = require('mix/write');
var program = require('commander');

program
    .usage('<command> [options]');
var dist = program
    .command('dist')
    .description('Build a distribution')
    .option('-O, --optimize <level>', 'Set optimization level', parseInt, 1)
    .action(function () {
        run('dist', dist.optimize);
    });
var develop = program
    .command('develop')
    .description('Serve on localhost:3000')
    .option('-O, --optimize <level>', 'Set optimization level', parseInt, 0)
    .action(function () {
        run('develop', develop.optimize);
    });
program.parse(process.argv);
// HACK: commander doesn't support required commands
if (typeof program.args[program.args.length - 1] !== 'object') {
    program.help();
}

function run(target, optimize) {
    // This is for envify
    process.env.NODE_ENV = optimize > 0 ? 'production' : 'development';

    // HTML
    var html = files({ base: 'src', globs: 'index.html' });

    // JavaScript
    var scripts = files({ base: 'src', globs: 'scripts/app.jsx' })
        .pipe(browserify({
            extensions: ['.js', '.jsx'],
            configure: function (b) {
                b.transform('reactify');
                b.require('../node_modules/react/react.js', { expose: 'react' });
            }
        }));
    if (optimize > 0) {
        scripts = scripts.pipe(uglify());
    }

    // CSS
    var styles = files({ base: 'src', globs: 'styles/app.scss' })
        .pipe(sass())
        .pipe(autoprefixer('last 2 versions', 'ie 9'));
    if (optimize > 0) {
        styles = styles.pipe(minifyCss());
    }

    // Assets
    var images = files({ base: 'src', globs: 'images/**/*' });

    // Output
    var build = mix.combine(html, scripts, styles, images)
        .pipe(rev())
        .pipe(stats());
    build.pipe(write('build/'));
    if (target === 'develop') {
        build.pipe(serve(3000));
    }

    // Linting
    var jsFiles = files({ base: 'src', globs: '**/*.js' });
    jsFiles.pipe(jshint());
}
