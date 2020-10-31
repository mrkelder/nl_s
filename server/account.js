async function account(fastify, object) {
  const { sendEmail } = require('../modules/mailer');
  const User = require('../modules/user');
  const { upload, fs, path } = object;
  const emailRegEx = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  fastify.post('/registrate', (req, reply) => {
    try {
      const { password, email, lang, name } = req.body;
      // Checks for proper length of password and email , looks for proper email shape
      if ([...password].length >= 6 && [...email].length >= 5 && emailRegEx.test(email) && [...name].length >= 2) {
        // Security

        const user = new User({ password: password, email: email });

        const normolisedPasswordHash = user.getReadyPassword();
        const acceptanceCode = user.createAcceptanceCode();

        // Forming the email data
        const pickedLang = lang === 'ua' || lang === 'ru' ? lang : 'ua';
        const subject = pickedLang === 'ua' ? 'Реєстрація на New London' : 'Регистрация на New London';
        const text = pickedLang === 'ua' ? `<p>Доброго дня, ${name}</p><p>Дякуємо вам за реєстрацію в нашому магазині New London.</p><p>Ваш код підтвердження: <b>${acceptanceCode}</b></p>` : `<p>Добрый день, ${name}.</p><p>Благодарим вас за регистрацию в нашем магазине New London.</p><p>Ваш код подтверждения: <b>${acceptanceCode}</b></p>`;

        // Creating a new user (not accepted)
        fastify.mongodb(async ({ db, client }) => {
          const users = await db.collection('users').find({ email }).toArray();
          // If such user exists
          if (users.length > 0) {
            if (!users[0].isActivated) {
              reply.code(200).send('Code has not been accepted');
            }
            else {
              reply.code(200).send('This user already exists');
            }
          }
          // If it does not exist
          else {
            // Sends email with acceptance
            sendEmail({
              from: process.env.GMAIL_LOGIN,
              to: email,
              password: process.env.GMAIL_PASSWORD,
              subject: subject,
              html: text
            });
            await db.collection('users').insertOne({ photo: 'default', phone: null, name: name, email: email, password: normolisedPasswordHash, isActivated: false, code: acceptanceCode , latelySeen: [] , bought: []});
            reply.code(200).send('Let user enter the code');
          }
          client.close();
        });
      }
      // If data is not valid
      else {
        reply.code(200).send('Data is not valid');
      }
    }
    catch (err) {
      reply.code(500).send('Data is not valid');
    }
  });

  fastify.post('/acceptCode', (req, reply) => {
    // Activates the unactivated users
    try {
      const { email, code } = req.body;
      // Checking for valid data
      if ([...email].length > 0 && [...code].length > 0) {
        fastify.mongodb(async ({ db, client }) => {
          const userArray = await db.collection('users').find({ email }).toArray();
          // Checks for user's existance
          if (userArray.length === 1) {
            // If codes are equal
            if (userArray[0].code === code) {
              await db.collection('users').updateOne({ email }, { $set: { isActivated: true } });
              reply.code(200).send('Accepted');
            }
            // If codes are not equal
            else {
              reply.code(200).send('Codes are not equal');
            }
          }
          else {
            reply.code(200).send('Such user does not exist');
          }
          client.close();
        });
      }
      // Data is invalid
      else {
        reply.send('Data is not valid').code(500);
      }
    }
    catch (err) {
      reply.code(500).send('Data is not valid');
    }
  });

  fastify.post('/authorisation', (req, reply) => {
    // Authorisation
    const { email, password } = req.body;
    const user = new User({ email: email, password: password });
    const readyPassword = user.getReadyPassword();

    fastify.mongodb(async ({ db, client }) => {
      // Does this account exist
      const mathUser = await db.collection('users').find({ email, password: readyPassword }).toArray();
      if (mathUser.length === 0) reply.code(200).send('Something went wrong');
      else if (!mathUser[0].isActivated) reply.code(200).send('User has not accepted his code')
      else reply.code(200).send('Okay');
      client.close();
    });
  });

  fastify.post('/getUser', (req, reply) => {
    // Looking for information about the user
    const { email, password } = req.body;
    const user = new User({ email: email, password: password });
    const readyPassword = user.getReadyPassword();

    fastify.mongodb(async ({ db, client, mongodb }) => {
      // Does this account exist
      const [mathUser] = await db.collection('users').find({ email, password: readyPassword }).project({ password: 0, code: 0, _id: 0 }).toArray();
      const properLatelySeen = [];
      const properBought = [];

      for (let i of mathUser.latelySeen) {
        const [oneItem] = await db.collection('items').find({ _id: mongodb.ObjectID(i) }).toArray();
        properLatelySeen.push(oneItem);
      }

      for (let i of mathUser.bought) {
        const [oneItem] = await db.collection('items').find({ _id: mongodb.ObjectID(i) }).toArray();
        properBought.push(oneItem);
      }

      mathUser.latelySeen = properLatelySeen;
      mathUser.bought = properBought;

      reply.code(200).send(mathUser);
      client.close();
    });
  });

  fastify.route({
    method: 'POST',
    url: '/changeUserParams',
    preHandler: upload.single('file'),
    handler: async function (req, reply) {

      const condition = /^\+?(\d{2,3})?\s?\(?\d{2,3}\)?[ -]?\d{2,3}[ -]?\d{2,3}[ -]?\d{2,3}$/i;
      let originalname, destination, filename;
      if (req.file) {
        originalname = req.file.originalname;
        destination = req.file.destination;
        filename = req.file.filename;
      }
      const { phone, password, email } = req.body;

      const user = new User({ email: email, password: password, fastify: fastify });
      const readyPassowrd = user.getReadyPassword();

      let extension, pathToUploadedFile, pathToNewFile, fileData;
      if (req.file) {
        extension = path.extname(originalname);
        pathToUploadedFile = path.join(__dirname, '../', destination, filename);
        pathToNewFile = path.join(__dirname, '../static', `${filename}${extension}`);
        fileData = fs.readFileSync(pathToUploadedFile);
      }

      if (await user.userExists()) {
        if (req.file) {
          fs.writeFileSync(pathToNewFile, fileData);
          fs.unlinkSync(pathToUploadedFile);
          fastify.mongodb(async ({ db, client }) => {
            let configutation = { photo: `${filename}${extension}` };
            if (condition.test(phone)) configutation.phone = phone;
            await db.collection('users').updateOne({ email: email, password: readyPassowrd }, { $set: configutation });
            client.close();
            reply.code(200).send('SUCCESS');
          });
        }
        else if (condition.test(phone)) {
          fastify.mongodb(async ({ db, client }) => {
            await db.collection('users').updateOne({ email: email, password: readyPassowrd }, { $set: { phone: phone } });
            client.close();
            reply.code(200).send('SUCCESS');
          });
        }
        else {
          reply.code(500).send('NOT SUCCESS');
        }
      }
      else {
        reply.code(500).send('NOT SUCCESS');
      }
    }
  });

  fastify.post('/getLatelySeenProduct', (req, reply) => {
    const { productId, email, password } = req.body;
    const user = new User({ email: email, password: password });
    const readyPassword = user.getReadyPassword();

    fastify.mongodb(async ({ db, client }) => {
      const [user] = await db.collection('users').find({ password: readyPassword, email }).toArray();
      if (!user.latelySeen.includes(productId)) {
        await db.collection('users').updateOne({ password: readyPassword, email }, {
          $push: {
            latelySeen: {
              $each: [productId],
              $position: 0,
              $slice: 20
            }
          }
        });
      }
      client.close();
      reply.send('Okay');
    });
  });
}

module.exports = account;