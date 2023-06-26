import db from '../lib/db.js';

// node ./server/migrations/v6.js

console.log('begin');
const collection = db.collection('wallets');

async function run() {
  let wallets = [];
  const batchSize = 1000;
  let count = 0;
  do {
    wallets = await collection.find({ 'settings.1fa_private': { $exists: true } }).limit(batchSize).toArray();

    const ops = wallets.map((wallet) => {
      wallet.settings['1fa_wallet'] = wallet.settings['1fa_private'];
      delete wallet.settings['1fa_private'];

      wallet.authenticators.forEach((authenticator) => {
        authenticator.credentialPublicKey = authenticator.publicKey;
        delete authenticator.publicKey;
      });

      wallet.devices.forEach((device) => {
        device.device_token = device.public_token;
        device.wallet_token = device.private_token;
        delete device.public_token;
        delete device.private_token;

        device.failed_attempts = {};
        device.challenges = {};

        if (device.authenticator) {
          device.authenticator.credentialPublicKey = device.authenticator.publicKey;
          delete device.authenticator.publicKey;
        }
      });

      const update = { $set: wallet };
      return {
        updateOne: {
          filter: { _id: wallet._id },
          update,
        },
      };
    });
    if (ops.length) {
      await collection.bulkWrite(ops);
      count += ops.length;
    }
    console.log(`count: ${count}`);
  } while (wallets.length);
  console.log('done');
}

try {
  await run();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}

