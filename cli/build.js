#!/usr/bin/env node
'use strict';

var program = require('commander');
var pkg = require('../package.json');

program
  .version(pkg.version)
  .name('build.js')
  .command('web', 'build and deploy web app')
  .command('android', 'build android app')
  .command('ios', 'build ios app')
  .command('electron', 'build electron app')
  .parse(process.argv);
