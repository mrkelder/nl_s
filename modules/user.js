const crypto = require('crypto');

class User {
  constructor({ email, password, fastify }) {
    this.email = email;
    this.password = password;
    this.fastify = fastify;
  }

  getReadyPassword() {
    const passwordHash = crypto.pbkdf2Sync(this.password, this.email, 100000, 64, 'sha512');
    const normolisedPasswordHash = passwordHash.toString('hex');
    return normolisedPasswordHash;
  }

  createAcceptanceCode() {
    const acceptanceCode = crypto.randomBytes(4).toString('hex');
    return acceptanceCode;
  }

  async userExists() {
    const doesUserExist = await new Promise(res => {
      this.fastify.mongodb(async ({ db, client }) => {
        const [data] = await db.collection('users').find({ email: this.email, password: this.getReadyPassword() }).toArray();
        client.close();
        if (data) res(true);
        else res(false);
      });
    });

    return doesUserExist;
  }
}

module.exports = User;