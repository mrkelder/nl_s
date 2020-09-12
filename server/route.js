async function route(fastify, object) {

  const { bot } = object;

  fastify.get('/', (req, reply) => {
    const fs = require('fs');
    const path = require('path');
    reply.send(`Welcome to NL server ${JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).version}`);
  });

  fastify.get('/getProperties', (req, reply) => {
    const { category } = req.query;
    if (category !== undefined) {
      fastify.mongodb(async ({ db, client }) => {
        const [data] = await db.collection('ad').find({ name: 'properties' }).project({ prop: 1, _id: 0 }).toArray();
        let properties = [];
        try {
          properties = data.prop[data.prop.findIndex(i => i.name === category)].properties;
        }
        catch (err) {
          console.error('Empty property query in the store\n└───', err.message);
        }
        finally {
          reply
            .code(200)
            .header('Access-Control-Allow-Origin', '*')
            .send(properties);
          client.close();
        }
      });
    }
    else reply.header('Access-Control-Allow-Origin', '*').code(500).send('Set the category!');
  });

  fastify.get('/getSlides', (req, reply) => {
    // Gives slides for slider in the main page
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
    // Gives top items for the main page
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
    // Gets all available shops
    fastify.mongodb(async ({ db, client, mongodb }) => {
      const cities = await db.collection('cities').find({}).toArray();
      const readyCities = [];

      for (let city of cities) {
        const currentCity = city;
        const prepearingCity = [];
        for (let shop of city.shops) {
          // Gets shops depending on city
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
    // Gets banners for the main page (/ - root)
    fastify.mongodb(async ({ db, client }) => {
      const info = await db.collection('ad').find({ name: 'banners' }).project({ img: 1, _id: 0 }).toArray();
      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(info[0].img);
      client.close();
    });
  });

  fastify.get('/getCompaniesForStore', (req, reply) => {
    const category = `/${req.query.category}`;
    fastify.mongodb(async ({ db, client }) => {
      // Retrieves the list of the companies that have certain products
      const companies = await db.collection('companies').find({ 'items.name': category }).toArray();
      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(companies);
      client.close();
    });
  });

  fastify.get('/getCatalog', (req, reply) => {
    // Retrieves the catalog for the header 
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

  fastify.get('/getItems', (req, reply) => {
    const { itemsCategory, amountOfIncoming, extraInfo } = req.query;

    let configuration = { link: itemsCategory };
    let sort = {};

    if (extraInfo !== undefined && typeof JSON.parse(extraInfo) === 'object' && JSON.parse(extraInfo).status !== 1) {
      const extraConfig = JSON.parse(extraInfo);
      const { properties, maxPrice, minPrice, pickedCompanies, sequence } = extraConfig;

      // If any brands are picked then search items by the picked brands
      if (pickedCompanies.length > 0) configuration.brand = { $in: pickedCompanies };

      // If any properties are picked then search items by the picked properties
      if (properties !== undefined && properties.length > 0) configuration.properties = { $in: properties };

      // Looks for items whoose prices fit the range of price
      configuration['themes.price'] = { $gte: minPrice, $lte: maxPrice };

      // Sorts items by the sequence
      switch (sequence) {
        case 1: sort = {}; break;
        case 2: sort['themes.price'] = -1; break;
        case 3: sort['themes.price'] = 1; break;
        default: sort = {}; break;
      }
    }

    fastify.mongodb(async ({ db, client }) => {
      const items = await db.collection('items').find(configuration).limit(Number(amountOfIncoming)).sort(sort).toArray();
      let readyItems;
      if (extraInfo !== undefined && JSON.parse(extraInfo).status === 1) {
        readyItems = items.filter(i => JSON.parse(extraInfo).pickedCompanies.includes(i.brand))
      }
      else {
        readyItems = items;
      }
      reply
        .code(200)
        .header('Access-Control-Allow-Origin', '*')
        .send(readyItems);
      client.close();
    });
  });
}

module.exports = route;