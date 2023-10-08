#!/usr/bin/env node

require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');
const vhost = require('vhost');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const logger = require('./lib/logger');

const { argv } = yargs(hideBin(process.argv))
  .options('port', {
    type: 'number',
    demandOption: true,
    default: 8080,
  })
  .options('work-dir', {
    type: 'string',
    default: 'public',
  })
  .options('terminate-after-seconds', {
    type: 'number',
  })
  .options('amqp-url', {
    type: 'string',
  })
  .options('amqp-exchange', {
    type: 'string',
  })
  .options('silent', {
    type: 'boolean',
  })
  .check((args) => {
    if (Array.isArray(args.port)) {
      return 'Too many arguments: port';
    }

    if (Array.isArray(args['work-dir'])) {
      return 'Too many arguments: work-dir';
    }

    if (Array.isArray(args['amqp-url'])) {
      return 'Too many arguments: amqp-url';
    }

    if (Array.isArray(args['amqp-exchange'])) {
      return 'Too many arguments: amqp-exchange';
    }

    if (Array.isArray(args['terminate-after-seconds'])) {
      return 'Too many arguments: terminate-after-seconds';
    }

    return true;
  })
  .strict();

const {
  port,
  workDir,
  terminateAfterSeconds,
  amqpUrl,
  amqpExchange,
  silent,
} = argv;

const app = express();

if (silent) {
  logger.setSilent(silent);
}

if (terminateAfterSeconds) {
  setTimeout(() => {
    logger.log({
      ts: new Date(),
      msg: `Terminated after running ${terminateAfterSeconds} secs`,
    });
    process.exit(0);
  }, terminateAfterSeconds * 1000);
}

app.use(vhost(/.+/, async (req, res, next) => {
  try {
    const vhostDirStats = await fs.stat(path.join(workDir, req.vhost.hostname));
    if (vhostDirStats.isDirectory()) {
      req.url = path.join(req.vhost.hostname, req.path);
    }
  } catch (e) {
    //
  }

  logger.log({
    ts: new Date(),
    msg: 'Got a request',
    remoteAddress: req.ip,
    vhost: req.vhost.hostname,
    url: req.originalUrl,
    translatedUrl: path.join(req.vhost.hostname, req.url),
  });

  next();
}));

app.use(express.static(workDir));

app.use((req, res) => {
  res.status(404).json({
    status: 404,
    path: req.path,
    msg: 'Not found',
  });
});

(async () => {
  if (amqpUrl && amqpExchange) {
    await logger.setAmqp(amqpUrl, amqpExchange);
  }

  app.listen(port, () => {
    logger.log({
      ts: new Date(),
      msg: 'Ready to served',
    });
  })
    .on('error', (e) => {
      // eslint-disable-next-line no-console
      console.log('EXCEPTION');
      // eslint-disable-next-line no-console
      console.log(`ECODE: ${e.code}`);
      // eslint-disable-next-line no-console
      console.log(`EMESSAGE: ${e.message || e.toString()}`);
    });
})();