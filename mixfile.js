#!/usr/bin/env node
'use strict';

var autoprefixer = require('mix-autoprefixer');
var browserify = require('mix-browserify');
var files = require('mix-files');
var jshint = require('mix-jshint');
var minifyCss = require('mix-minify-css');
var mix = require('mix');
var rev = require('mix-rev');
var sass = require('mix-sass');
var serve = require('mix-serve');
var stats = require('mix-stats');
var uglify = require('mix-uglify');
var write = require('mix-write');

var html = files({ base: 'src', globs: 'index.html' });
var compileScripts = browserify({
    extensions: ['.js', '.jsx'],
    configure: function (b) {
        b.transform('reactify');
        b.require('../node_modules/react/react.js', { expose: 'react' });
    }
});
compileScripts.changed.pipe(jshint());
var scripts = files({ base: 'src', globs: 'scripts/app.jsx' })
    .pipe(compileScripts)
    .pipe(uglify());
var styles = files({ base: 'src', globs: 'styles/app.scss' })
    .pipe(sass())
    .pipe(autoprefixer('last 2 versions', 'ie 9'))
    .pipe(minifyCss());
var build = mix.combine(html, scripts, styles)
    .pipe(rev())
    .pipe(stats());
build.pipe(write('build/'));
build.pipe(serve(3000));
