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
    else {
      reply
        .code(300)
        .header('Access-Control-Allow-Origin', '*')
        .send('Простите , что-то пошло не так');
    }
  });

  fastify.get('/getCatalog', (req, reply) => {
    fastify.mongodb(async ({ db, client, mongodb }) => {
      try {
        const catalog = await db.collection('catalog').find({}).toArray();
        const newCatalog = catalog;

        for (let [itemIndex, item] of catalog.entries()) {
          for (let [companiesIndex, companies] of item.items.entries()) {
            for (let [companyIndex, company] of companies.companies.entries()) {
              const foundCompany = await db.collection('companies').find({ _id: mongodb.ObjectID(company) }).toArray();
              newCatalog[itemIndex].items[companiesIndex].companies[companyIndex] = foundCompany[0];
            }
          }
        }
        db.collection('compannies').find({})
        reply
          .code(200)
          .header('Access-Control-Allow-Origin', '*')
          .send(JSON.stringify(newCatalog));
        client.close();
      }
      catch (err) {
        console.error(err.message);
      }
    });
  });
}

module.exports = route;