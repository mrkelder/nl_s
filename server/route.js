async function route(fastify, object) {

  const { bot, assert } = object;

  fastify.get('/', (req, reply) => {
    const fs = require('fs');
    const path = require('path');
    reply.send(`Welcome to NL server ${JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).version}`);
  });

  fastify.get('/getSlides', (req, reply) => {
    fastify.mongodb(async ({ db, client }) => {
      const slides = await db.collection('ad').find({ name: 'slider' }).project({ _id: 0, name: 0 }).toArray();
      client.close();
      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(slides[0]);
    });
  });

  fastify.get('/getTopItems', (req, reply) => {
    fastify.mongodb(async ({ db, client, mongodb }) => {
      const topItems = await db.collection('ad').find({ name: 'top_items' }).project({ _id: 0, name: 0 }).toArray();
      const ids = [];
      let items;

      for (let i of topItems[0].items) {
        ids.push(mongodb.ObjectID(i));
      }

      items = await db.collection('items').find({ _id: { $in: ids } }).toArray();

      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(items);
      client.close();
    });
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

  fastify.get('/getShops', (req, reply) => {
    fastify.mongodb(async ({ db, client , mongodb}) => {
      const cities = await db.collection('cities').find({}).toArray();
      const readyCities = [];

      for(let city of cities){
        const currentCity = city;
        const prepearingCity = [];
        for(let shop of city.shops){
          const city = await db.collection('shops').find({ _id: mongodb.ObjectID(shop) }).toArray();
          prepearingCity.push(city[0]);
        }
        currentCity.shops = prepearingCity;
        readyCities.push(currentCity);
      }

      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(readyCities);
      client.close();
    });
  });

  fastify.get('/getBanners', (req, reply) => {
    fastify.mongodb(async ({ db, client }) => {
      const info = await db.collection('ad').find({ name: 'banners' }).project({ img: 1, _id: 0 }).toArray();
      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(info[0].img);
      client.close();
    });
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