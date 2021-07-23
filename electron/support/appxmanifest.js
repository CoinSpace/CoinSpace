'use strict';
const fs = require('fs/promises');
const ejs = require('ejs');

module.exports = function appxmanifest(config) {
  return async function electronPackagerAppxmanifest(buildPath, electronVersion, platform, arch, callback) {
    const template = await fs.readFile('./resources/appxmanifest.ejs', 'utf8');
    const content = ejs.render(template, config);
    await fs.writeFile('./resources/appxmanifest.xml', content);
    callback();
  };
};
