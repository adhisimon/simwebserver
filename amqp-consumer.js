const amqplib = require('amqplib');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv))
  .options('amqp-url', { type: 'string', demandOption: true })
  .options('amqp-exchange', { type: 'string', demandOption: true })
  .strict();

(async () => {
  const conn = await amqplib.connect(argv.amqpUrl);
  const ch = await conn.createChannel();
  await ch.assertExchange(argv.amqpExchange, 'fanout', { durable: false });
  const queue = await ch.assertQueue('', { exclusive: true });

  // eslint-disable-next-line no-console
  console.log(`Waiting for messages in ${queue.queue}`);

  await ch.bindQueue(queue.queue, argv.amqpExchange, '');

  await ch.consume(queue.queue, (msg) => {
    if (msg.content) {
      // eslint-disable-next-line no-console
      console.log(msg.content.toString());
    }
  }, { noAck: true });
})();
