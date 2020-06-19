#!/usr/bin/env node
'use strict';

var program = require('commander');
var fse = require('fs-extra');
var path = require('path');
var jsToXliff12 = require('xliff/jsToXliff12');
var xliff12ToJs = require('xliff/xliff12ToJs');

function list(value) {
  return value.split(',');
}

program
  .name('i18n.js')
  .option('--json', 'make json from xlf')
  .option('--xlf', 'update xlf from en.json')
  .option('-e, --exclude <items>', 'excluded languages', list, [])
  .parse(process.argv);

console.log('Start...');

var en = require(path.resolve('./app/lib/i18n/translations/en.json'));

function run(program) {
  if (program.xlf) return xlf(program);
  if (program.json) return json(program);
}

function xlf(program) {
  fse.readdirSync('./app/lib/i18n/xlf').forEach(function(file) {
    if (!file.endsWith('.xlf')) return;

    var dest = path.resolve('./app/lib/i18n/xlf', file);
    var js = xliff12ToJs(fse.readFileSync(dest, 'utf8'));

    if (program.exclude.includes(js.targetLanguage)) return;
    console.log(`${js.targetLanguage}`);

    var resource = Object.keys(js.resources)[0];

    var existed = js.resources[resource];
    var keys = {};
    Object.keys(en).forEach(function(key) {
      keys[key] = {
        source: en[key],
        target: '',
      };

      if (existed[key] && existed[key].target) {
        keys[key].target = existed[key].target;
      }
    });
    js.resources = { [resource]: keys };
    var xliff = jsToXliff12(js, {});

    fse.writeFileSync(dest, xliff);
    console.log(`${dest} saved.`);
  });
}

function json() {
  program.exclude.push('empty');
  fse.readdirSync('./app/lib/i18n/xlf').forEach(function(file) {
    if (!file.endsWith('.xlf')) return;

    var data = fse.readFileSync(path.resolve('./app/lib/i18n/xlf', file), 'utf8');

    var js = xliff12ToJs(data);

    if (program.exclude.includes(js.targetLanguage)) return;

    console.log(js.targetLanguage);

    var resource = Object.keys(js.resources)[0];
    var dest = path.resolve('./app/lib/i18n/translations', resource);

    var translations = {};

    Object.keys(en).forEach(function(key) {
      translations[key] = en[key];
      if (js.resources[resource][key] && js.resources[resource][key].target) {
        translations[key] = js.resources[resource][key].target;
      }
    });

    fse.writeFileSync(dest, JSON.stringify(translations, null, 2) + '\n', 'utf8');
    console.log(`${dest} saved.`);
  });
}

run(program);
