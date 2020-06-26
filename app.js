const fastify = require('fastify')();
const assert = require('assert');

fastify.get('/', (req, reply) => {
  reply.send('Hellow , world!');
});

fastify.ready(err => {
  assert.equal(err, null);
  console.log('Available at http://localhost:8080');
})

fastify.listen(8080);