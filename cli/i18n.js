#!/usr/bin/env node
'use strict';

const program = require('commander');
const fse = require('fs-extra');
const path = require('path');
const jsToXliff12 = require('xliff/jsToXliff12');
const xliff12ToJs = require('xliff/xliff12ToJs');
const klaw = require('klaw-sync');

function list(value) {
  return value.split(',');
}

program
  .name('i18n.js')
  .option('--json', 'make json from xlf')
  .option('--xlf', 'update xlf from en.json')
  .option('--extract', 'extract strings to translate')
  .option('-e, --exclude <items>', 'excluded languages', list, [])
  .parse(process.argv);

console.log('Start...');

const en = require(path.resolve('./app/lib/i18n/translations/en.json'));

function run(program) {
  if (program.xlf) return xlf(program);
  if (program.json) return json(program);
  if (program.extract) return extract(program);
}

function xlf(program) {
  fse.readdirSync('./app/lib/i18n/xlf').forEach((file) => {
    if (!file.endsWith('.xlf')) return;

    const dest = path.resolve('./app/lib/i18n/xlf', file);
    const js = xliff12ToJs(fse.readFileSync(dest, 'utf8'));

    if (program.exclude.includes(js.targetLanguage)) return;
    console.log(`${js.targetLanguage}`);

    const resource = Object.keys(js.resources)[0];

    const existed = js.resources[resource];
    const keys = {};
    let units = 0;
    let words = 0;
    Object.keys(en).forEach((key) => {
      keys[key] = {
        source: en[key],
        target: '',
      };

      if (existed[key] && existed[key].target) {
        keys[key].target = existed[key].target;
      } else {
        units = units + 1;
        words = words + en[key].split(' ').length;
      }
    });
    console.log(`${js.targetLanguage}: ${units} units with ${words} words per language.`);
    js.resources = { [resource]: keys };
    const xliff = jsToXliff12(js, {});

    fse.writeFileSync(dest, xliff);
    console.log(`${dest} saved.`);
  });
}

function json() {
  const list = [];
  program.exclude.push('empty');
  fse.readdirSync('./app/lib/i18n/xlf').forEach((file) => {
    if (!file.endsWith('.xlf')) return;

    const data = fse.readFileSync(path.resolve('./app/lib/i18n/xlf', file), 'utf8');

    const js = xliff12ToJs(data);

    if (program.exclude.includes(js.targetLanguage)) return;

    console.log(js.targetLanguage);

    list.push(js.targetLanguage);
    const resource = Object.keys(js.resources)[0];
    const dest = path.resolve('./app/lib/i18n/translations', resource);

    const translations = {};

    Object.keys(en).forEach((key) => {
      translations[key] = en[key];
      if (js.resources[resource][key] && js.resources[resource][key].target) {
        translations[key] = js.resources[resource][key].target;
      }
    });

    fse.writeFileSync(dest, JSON.stringify(translations, null, 2) + '\n', 'utf8');
    console.log(`${dest} saved.`);
  });
  const dest = path.resolve('./app/lib/i18n/list.json');
  fse.writeFileSync(dest, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

function extract() {
  const files = klaw('./app', {
    nodir: true,
    traverseAll: true,
    filter(item) {
      const extname = path.extname(item.path);
      return ['.js', '.ract'].includes(extname);
    },
  });
  const keys = new Set();
  for (const file of files) {
    const content = fse.readFileSync(file.path, 'utf8');
    const regexps = [
      /translate\('([^']*)/g,
      /translate\("([^"]*)/g,
      /translate\(`([^`]*)/g,
    ];
    for (const regexp of regexps) {
      let match;
      while ((match = regexp.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }
  }
  for (const key of keys.values()) {
    if (!en[key]) {
      en[key] = key;
    }
  }
  for (const key in en) {
    if (!keys.has(key)) {
      delete en[key];
    }
  }
  fse.writeFileSync(path.resolve('./app/lib/i18n/translations/en.json'), JSON.stringify(en, null, 2) + '\n', 'utf8');
  console.log('Done!');
}

run(program);
