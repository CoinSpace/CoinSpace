/* eslint-env node */
import fs from 'node:fs/promises';
import path from 'node:path';

const interpolation = /\{[^}]+\}/ig;
const messages = './src/lib/i18n/messages';

const names = (await fs.readdir(messages)).filter((item) => item.endsWith('.json'));
const files = await Promise.all(names.map(async (name) => {
  return {
    name,
    data: JSON.parse(await fs.readFile(path.resolve(messages, name), 'utf-8')),
  };
}));

function check() {
  let ok = true;
  for (const { name, data } of files) {
    for (const key of Object.keys(data)) {
      for (const match of key.matchAll(interpolation)) {
        if (!data[key].includes(match[0])) {
          const msg = `${name} "${key}" Missing interpolation ${match[0]} in "${data[key]}"`;
          console.log(msg);
          ok = false;
        }
      }
    }
  }
  if (!ok) {
    throw new Error('Missing interpolation!');
  }
}

function count() {
  let total = 0;
  for (const { name, data } of files) {
    const count = Object.keys(data).reduce((count, key) => {
      if (data[key]) return count;
      return count + key.split(' ').filter((word) => !word.match(interpolation)).length;
    }, 0);
    total += count;
    console.log(`${name} \t${count}`);
  }
  console.log(`total untranslated words: ${total} `);
}

switch (process.argv[2]) {
  case 'count':
    count();
    break;
  case 'check':
    check();
    break;
  default:
    throw new Error('Unsupported command');
}
