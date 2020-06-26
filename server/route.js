async function route(fastify, object) {

  const { bot } = object;

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
        .then(() => { reply.send('Мы перезвоним вам в ближайшее время'); });
    }
  });
}

module.exports = route;