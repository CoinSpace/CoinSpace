import db from '../lib/db.js';

// node ./server/migrations/v6.storage.js

console.log('begin');
const collection = db.collection('storage');

async function run() {
  const configs = [
    {
      from: '_eos',
      to: '_eos@eos',
      regex: /_eos$/,
    },
    {
      from: '_monero',
      to: '_monero@monero',
      regex: /_monero$/,
    },
  ];

  for (const config of configs) {
    await migrateConfig(config);
  }
  console.log('done');
}

async function migrateConfig({ from, to, regex }) {
  console.log(`migrate from "${from}" to "${to}:`);
  let count = 0;
  let storages = [];
  const batchSize = 1000;
  do {
    const ops = [];
    storages = await collection.find({ _id: { $regex: regex } }).limit(batchSize).toArray();
    storages.forEach((storage) => {
      ops.push({ insertOne: { document: { ...storage, _id: storage._id.replace(from, to) } } });
      ops.push({ deleteOne: { filter: { _id: storage._id } } });
    });
    if (ops.length) {
      await collection.bulkWrite(ops);
      count += ops.length;
    }
    console.log(`count: ${count}`);
  } while (storages.length);
}

try {
  await run();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}

