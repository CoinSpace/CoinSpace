import cryptoDB from '@coinspace/crypto-db';
import fs from 'node:fs/promises';
import util from 'node:util';

const schemes = cryptoDB
  .filter((item) => item.scheme && item.supported !== false)
  .map((item) => {
    return {
      _id: item._id,
      scheme: item.scheme,
    };
  });

await fs.writeFile('../web/src/lib/schemes.js',
  util.format('/* eslint-disable comma-dangle */\nexport default %O;\n', schemes));
