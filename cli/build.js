#!/usr/bin/env node
'use strict';

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .name('build.js')
  .command('web', 'build and deploy web app')
  .command('phonegap', 'build phonegap app')
  .command('electron', 'build electron app')
  .parse(process.argv);
