async function route(fastify, object) {

  const { bot, assert } = object;

  fastify.get('/', (req, reply) => {
    const fs = require('fs');
    const path = require('path');
    reply.send(`Welcome to NL server ${JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).version}`);
  });

  fastify.get('/callMeBack', (req, reply) => {
    const condition = /^\+?(\d{2,3})?\s?\(?\d{2,3}\)?[ -]?\d{2,3}[ -]?\d{2,3}[ -]?\d{2,3}$/i;
    const { number } = req.query;
    if (condition.test(number)) {
      bot.sendMessage({ chat_id: process.env.TELEGRAM_CHAT, text: `Горячая линия: ${number}` })
        .then(() => {
          reply
            .code(200)
            .header('Access-Control-Allow-Origin', '*')
            .send('Мы перезвоним вам в ближайшее время');
        });
    }
  });

  fastify.get('/getCatalog', (req, reply) => {
    fastify.mongodb(({ db, client }) => {
      db.collection('catalog').find({}).toArray((err, arr) => {
        assert.equal(err, null);
        reply
          .code(200)
          .header('Access-Control-Allow-Origin', '*')
          .send(JSON.stringify(arr));
        client.close();
      });
    });
  });
}

module.exports = route;