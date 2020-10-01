async function account(fastify, object) {
  const { sendEmail } = require('./mailer');
  const { crypto } = object;
  const emailRegEx = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  fastify.post('/registrate', (req, reply) => {
    try {
      const { password, email, lang, name } = req.body;
      // Checks for proper length of password and email , looks for proper email shape
      if ([...password].length >= 6 && [...email].length >= 5 && emailRegEx.test(email) && [...name].length >= 2) {
        // Security
        const passwordHash = crypto.pbkdf2Sync(password, email, 100000, 64, 'sha512');
        const normolisedPasswordHash = passwordHash.toString('hex');
        const acceptanceCode = crypto.randomBytes(4).toString('hex');

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
            await db.collection('users').insertOne({ name: name, email: email, password: normolisedPasswordHash, isActivated: false, code: acceptanceCode });
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
    const passwordHash = crypto.pbkdf2Sync(password, email, 100000, 64, 'sha512');
    const readyPassword = passwordHash.toString('hex');

    fastify.mongodb(async ({ db, client }) => {
      // Does this account exist
      const mathUser = await db.collection('users').find({ email, password: readyPassword }).toArray();
      if (mathUser.length === 0) reply.code(200).send('Something went wrong');
      else if(!mathUser[0].isActivated) reply.code(200).send('User has not accepted his code')
      else reply.code(200).send('Okay');
      client.close();
    });
  });

  fastify.post('/getUser' , (req , reply) => {
    // Looking for information about the user
    const { email, password } = req.body;
    const passwordHash = crypto.pbkdf2Sync(password, email, 100000, 64, 'sha512');
    const readyPassword = passwordHash.toString('hex');

    fastify.mongodb(async ({ db, client }) => {
      // Does this account exist
      const mathUser = await db.collection('users').find({ email, password: readyPassword }).project({ password: 0 , code: 0 , _id: 0 }).toArray();
      reply.code(200).send(mathUser[0]);
      client.close();
    });
  });
}

module.exports = account;