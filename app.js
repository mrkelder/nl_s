const fastify = require('fastify')();
const assert = require('assert');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const multer = require('fastify-multer');
const upload = multer({ dest: 'uploads/' });

require('dotenv').config();
const telegram = require('telegram-bot-api');
const api = new telegram({
  token: process.env.TELEGRAM_TOKEN
});

fastify
  .register(multer.contentParser)
  .register(require('./server/route'), { bot: api, assert: assert })
  .register(require('./server/account'), { crypto: crypto, upload: upload , fs: fs, path: path })
  .register(require('./server/item'))
  .register(require('fastify-formbody'))
  .register(require('fastify-cors'))
  .register(require('fastify-static'), {
    root: path.join(__dirname, '/static'),
    prefix: '/'
  });

fastify.decorate('mongodb', func => {
  // Mongodb decoration
  const mongodb = require('mongodb');
  const MongoCLient = mongodb.MongoClient;
  const client = new MongoCLient('mongodb://localhost:27017', { useUnifiedTopology: true });

  client.connect(err => {
    assert.equal(err, null);
    const db = client.db('NL');
    func({
      db: db,
      client: client,
      mongodb: mongodb
    });
  });
});

fastify.ready(err => {
  assert.equal(err, null);
  console.log('Available at http://localhost:8080');
})

fastify.listen(8080);