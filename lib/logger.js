/* eslint-disable no-console */
const amqplib = require('amqplib');

let silent = false;

let amqpChannel;
let amqpExchange;
let amqpInitialized = false;

const setSilent = (isSilent) => {
  silent = isSilent;
};
exports.setSilent = setSilent;

const setAmqp = async (amqpUrl, exchangeName) => {
  try {
    const conn = await amqplib.connect(amqpUrl);
    amqpChannel = await conn.createChannel();

    amqpExchange = exchangeName;
    await amqpChannel.assertExchange(amqpExchange, 'fanout', { durable: false });

    amqpInitialized = true;

    if (!silent) {
      console.log(JSON.stringify({
        ts: new Date(),
        msg: 'AMQP established',
        amqpUrl,
        amqpExchange,
      }));
    }
  } catch (e) {
    console.log(JSON.stringify({
      ts: new Date(),
      msg: 'Exception on establishing AMQP',
      amqpUrl,
      amqpExchange,
      eCode: e.code,
      eMessage: e.message || e.toString(),
    }));

    process.exit(1);
  }
};
exports.setAmqp = setAmqp;

const log = (item) => {
  if (!silent) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(item));
  }

  if (amqpInitialized) {
    amqpChannel.publish(
      amqpExchange,
      '',
      Buffer.from(JSON.stringify(item)),
    );
  }
};
exports.log = log;
