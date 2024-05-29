/* eslint-env node */

// install https://github.com/socsieng/sendkeys
// node ./screenshots.js run [1-6]
// node ./screenshots.js alpha

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { languages } from '../src/lib/i18n/languages.js';
const langs = languages.map((item) => item.value).sort();

switch (process.argv[2]) {
  case 'run':
    makeScreenshots();
    break;
  case 'alpha':
    removeAlphaFromDir('./appstore');
    break;
  default:
    throw new Error('Unsupported command');
}

function makeScreenshots() {
  const dir = 'screenshots';

  const screenshots = [
    { file: 'localhost_5173_(screenshot iphone 6.5 _ 6.7).png', type: 'mobile', order: 1 },
    { file: 'localhost_5173_(screenshot iphone 5.5).png', type: 'mobileSmall', order: 2 },
    { file: 'localhost_5173_(screenshot ipad).png', type: 'tablet', order: 3 },
    { file: 'localhost_5173_(screenshot macbook).png', type: 'desktop', order: 4 },
  ];
  const suffix = '-' + (process.argv[3] || '1') + '.png';
  langs.forEach((lang, i) => {
    const initDelay = '--initial-delay=' + (i === 0 ? '1' : '0');
    // eslint-disable-next-line max-len
    shell(`sendkeys -a 'Google Chrome' --delay=0.01 ${initDelay} --characters "setLanguage('${lang}');<c:enter><c:0:command,shift>"`);
    shell('sleep 0.5');
    screenshots.forEach((screenshot) => {
      const screenshotPath = path.resolve(os.homedir(), 'Downloads', screenshot.file);
      if (fs.existsSync(screenshotPath)) {
        const destDir = path.resolve(dir, lang);
        const destFile = path.resolve(destDir, screenshot.order + '-' +screenshot.type) + suffix;
        fs.mkdirSync(destDir, { recursive: true });
        if (screenshot.type === 'mobile') {
          fs.copyFileSync(screenshotPath, destFile.replace('mobile', 'mobile-dub'));
        }
        fs.copyFileSync(screenshotPath, destFile);
        fs.rmSync(screenshotPath);
      }
    });
  });
}

function removeAlphaFromDir(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    if (path.extname(file) !== '.png') continue;
    removeAlpha(path.resolve(dir, file));
  }
}

function removeAlpha(path) {
  shell(`convert "${path}" -alpha off "${path}"`);
}

function shell(command) {
  console.log(`Executing: ${chalk.green(command)}`);
  const defaultOptions = { stdio: [0, 1, 2] };
  execSync(command, defaultOptions);
}
