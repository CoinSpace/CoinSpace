import fs from 'node:fs';
import path from 'node:path';

const messages = './src/lib/i18n/messages';

const files = fs.readdirSync(messages);
let total = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.resolve(messages, file), 'utf-8'));
  const count = Object.keys(data).reduce((count, key) => {
    if (data[key]) return count;
    return count + key.split(' ').length;
  }, 0);
  total += count;
  console.log(`${file} \t${count}`);
}
console.log(`total untranslated words: ${total} `);
