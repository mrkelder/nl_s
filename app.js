const fastify = require('fastify')();
const assert = require('assert');
require('dotenv').config();
const telegram = require('telegram-bot-api');
const api = new telegram({
  token: process.env.TELEGRAM_TOKEN
});

fastify.register(require('./server/route'), { bot: api });

fastify.decorate('mongodb', func => {
  // Mongodb decoration
  const mongodb = require('mongodb');
  const MongoCLient = mongodb.MongoClient;
  const client = new MongoCLient('mongodb://localhost:27017');

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