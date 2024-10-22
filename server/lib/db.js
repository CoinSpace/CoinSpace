import mongodb from 'mongodb';
const { MongoClient } = mongodb;

const client = await MongoClient.connect(process.env.DB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = client.db(process.env.DB_NAME);

await Promise.all([
  db.collection('mecto').createIndexes([
    { key: { geometry: '2dsphere' }, background: true },
    { key: { timestamp: 1 }, background: true, expireAfterSeconds: 60 * 60 }, // 1 hour
  ]),
  db.collection('tokens').createIndexes([
    { key: { symbol: 1 }, background: true, sparse: true },
    { key: { 'platforms.ethereum': 1 }, background: true, sparse: true },
    { key: { 'platforms.binance-smart-chain': 1 }, background: true, sparse: true },
    { key: { synchronized_at: 1 }, background: true },
  ]),
  db.collection('details').createIndexes([
    { key: { username_sha: 1 }, background: true, unique: true, sparse: true },
  ]),
  db.collection('wallets').createIndexes([
    { key: { username_sha: 1 }, background: true, unique: true, sparse: true },
    { key: { 'devices._id': 1 }, background: true, unique: true, sparse: true },
  ]),
  db.collection('releases').createIndexes([
    {
      key: {
        distribution: 1,
        arch: 1,
        app: 1,
      },
      background: true,
      unique: true,
    },
  ]),
  db.collection('cache').createIndexes([
    { key: { expire: 1 }, background: true, expireAfterSeconds: 0 },
  ]),
]);

export function dbMemoize(target, { key, ttl }) {
  if (!key) throw new TypeError('"key" is required');
  if (!ttl) throw new TypeError('"ttl" is required');
  let promise;
  return new Proxy(target, {
    apply(target, thisArg, argumentsList) {
      if (!promise) {
        promise = (async () => {
          try {
            const value = await db
              .collection('cache')
              .findOne({ _id: `cache-${key}` })
              .then((doc) => doc && JSON.parse(doc.value));
            if (value) {
              return value;
            }
            const result = await Reflect.apply(target, thisArg, argumentsList);
            try {
              return result;
            } finally {
              await db
                .collection('cache')
                .updateOne({
                  _id: `cache-${key}`,
                }, {
                  $set: {
                    value: JSON.stringify(result),
                    expire: new Date(Date.now() + ttl * 1000),
                  },
                }, { upsert: true });
            }
          } finally {
            promise = undefined;
          }
        })();
      }
      return promise;
    },
  });
}

export default db;
