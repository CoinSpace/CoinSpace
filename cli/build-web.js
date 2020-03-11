#!/usr/bin/env node

var program = require('commander');
var utils = require('./utils');
var warning = require('chalk').yellow;
var webpack = require('webpack');

program
  .name('build-web.js')
  .option('-e, --env <env>', 'environment', 'dev')
  .option('--scale <number>', 'scale web containers')
  .option('--no-deploy', 'no deploy')
  .parse(process.argv);

var currentDockerMachine = process.env.DOCKER_MACHINE_NAME ? process.env.DOCKER_MACHINE_NAME : 'local';
var envFile = `.env.${program.env}`;
console.log(`ENV_FILE: ${warning(envFile)}`)
console.log(`DOCKER MACHINE: ${warning(currentDockerMachine)}`)
console.log('Start building (webpack)...');

process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
var webpackConfig = require('../webpack.prod');

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({colors: true}));
  if (!program.deploy) {
    return console.log('Done! Deploy skipped.')
  }

  utils.shell('docker-compose build web');

  var config = program.env !== 'loc' ? `-f docker-compose.${program.env}.yml` : '';
  var scale = program.scale ? `--scale web=${program.scale}` : '';

  utils.shell(`docker-compose ${config} up -d ${scale}`);
  console.log('Done!');
});


