async function item(fastify, object) {

  fastify.post('/sendComment', (req, reply) => {
    const { allInfoAboutUser, text, adv, disadv, rating, productId, date, theme } = req.body;
    try {
      fastify.mongodb(async ({ db, client, mongodb }) => {
        await db.collection('items').updateOne({ _id: mongodb.ObjectID(productId) }, {
          $push: {
            reviews: {
              $each: [{
                name: allInfoAboutUser.name,
                text: text,
                rating: rating,
                date: date,
                advantages: adv,
                disadvantages: disadv,
                likes: 0,
                dislikes: 0,
                theme: theme
              }],
              $position: 0
            }
          }
        });

        // Recalculates an average rating for the item judging by the reviews
        const [item] = await db.collection('items').find({ _id: mongodb.ObjectID(productId) }).toArray();
        const allRatings = [];

        for (let i of item.reviews) {
          if (i.theme === theme) allRatings.push(i.rating);
        }

        let averageRating = Math.floor(allRatings.reduce((a, i) => a + i) / allRatings.length);

        if (averageRating > 5) averageRating = 5;
        else if (averageRating < 1) averageRating = 1;

        await db.collection('items').updateOne({ _id: mongodb.ObjectID(productId) }, { $set: { [`themes.${theme}.rating`]: averageRating } });
        client.close();
      });
    }
    catch (err) {
      reply.code(500).send('Not okay');
    }
    reply.code(200).send('Okay');
  });
}

module.exports = item;