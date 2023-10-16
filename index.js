#!/usr/bin/env node

const NEED_LICENSE = true;

require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');
const compression = require('compression');
const vhost = require('vhost');
const yargs = require('yargs/yargs');
const { machineId } = require('node-machine-id');
const { hideBin } = require('yargs/helpers');

const pjson = require('./package.json');
const logger = require('./lib/logger');
const license = require('./lib/license');

const { argv } = yargs(hideBin(process.argv))
  .version(pjson.version)
  .options('host', {
    type: 'string',
    default: process.env.SWS_HOST || null,
    describe: 'also obey SWS_HOST env',
  })
  .options('port', {
    type: 'number',
    default: Number(process.env.SWS_PORT) || 8080,
    describe: 'also obey SWS_PORT env',
  })
  .options('work-dir', {
    type: 'string',
    default: process.env.SWS_WORK_DIR || 'public',
    describe: 'also obey SWS_WORK_DIR env',
  })
  .options('terminate-after-seconds', {
    type: 'number',
    default: Number(process.env.SWS_TERMINATE_AFTER_SECONDS) || 0,
    describe: 'also obey SWS_TERMINATE_AFTER_SECONDS env',
  })
  .options('amqp-url', {
    type: 'string',
    default: process.env.SWS_AMQP_URL,
    describe: 'also obey SWS_AMQP_URL env',
  })
  .options('amqp-exchange', {
    type: 'string',
    default: process.env.SWS_AMQP_EXCHANGE,
    describe: 'also obey SWS_AMQP_EXCHANGE env',
  })
  .options('silent', {
    type: 'boolean',
    default: !!process.env.SWS_SILENT,
    describe: 'also obey SWS_SILENT env',
  })
  .options('pidfile', {
    type: 'string',
    default: process.env.SWS_PIDFILE,
  })
  .options('dump-machine-id', {
    type: 'boolean',
  })
  .options('generate-build-json', {
    type: 'boolean',
    hidden: NEED_LICENSE,
  })
  .options('generate-private-key-json', {
    type: 'boolean',
    hidden: NEED_LICENSE,
  })
  .options('generate-public-key-json', {
    type: 'boolean',
    hidden: NEED_LICENSE,
  })
  .options('generate-license', {
    type: 'string',
    hidden: NEED_LICENSE,
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

    if (Array.isArray(args.silent)) {
      return 'Too many arguments: silent';
    }

    if (Array.isArray(args.pidfile)) {
      return 'Too many arguments: pidfile';
    }

    return true;
  })
  .strict();

const {
  host,
  port,
  workDir,
  terminateAfterSeconds,
  amqpUrl,
  amqpExchange,
  silent,
  dumpMachineId,
  generateBuildJson,
  generatePrivateKeyJson,
  generatePublicKeyJson,
  generateLicense,
} = argv;

// eslint-disable-next-line no-console
// console.log(JSON.stringify(argv, null, 2));
// process.exit(0);

const app = express();
app.use(compression());

if (silent) {
  logger.setSilent(silent);
}

if (terminateAfterSeconds) {
  setTimeout(() => {
    logger.log({
      ts: new Date(),
      pid: process.pid,
      msg: `Terminated after running ${terminateAfterSeconds} secs`,
    });
    process.exit(0);
  }, terminateAfterSeconds * 1000);
}

app.use(vhost(/.+/, async (req, res, next) => {
  try {
    const vhostDirStats = await fs.stat(path.join(workDir, req.vhost?.hostname));
    if (vhostDirStats.isDirectory()) {
      req.url = path.join(req.vhost?.hostname, req.path);
    }
  } catch (e) {
    //
  }

  logger.log({
    ts: new Date(),
    pid: process.pid,
    msg: 'Got a request',
    remoteAddress: req.ip,
    vhost: req.vhost?.hostname,
    url: req.originalUrl,
    translatedUrl: path.join(req.vhost?.hostname, req.originalUrl),
  });

  next();
}));

app.use(express.static(workDir));

app.use((req, res) => {
  res.status(404).json({
    status: 404,
    msg: 'Not found',
    vhost: req.vhost?.hostname,
    url: req.originalUrl,
  });

  logger.log({
    ts: new Date(),
    msg: '404 NOT FOUND',
    vhost: req.vhost?.hostname,
    url: req.originalUrl,
  });
});

(async () => {
  if (dumpMachineId) {
    // eslint-disable-next-line no-console
    console.log(await machineId());

    process.exit(0);
  }

  if (generateBuildJson) {
    const privateKey = (await fs.readFile('private.pem')).toString();
    const publicKey = (await fs.readFile('public.pem')).toString();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ privateKey, publicKey }, null, 2));
    process.exit(0);
  }

  if (generatePrivateKeyJson) {
    const privateKey = (await fs.readFile('private.pem')).toString();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ key: privateKey }, null, 2));
    process.exit(0);
  }

  if (generatePublicKeyJson) {
    const publicKey = (await fs.readFile('public.pem')).toString();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ key: publicKey }, null, 2));
    process.exit(0);
  }

  if (generateLicense) {
    const licenseContent = await license.generateLicense(generateLicense);
    // eslint-disable-next-line no-console
    console.log(licenseContent);
    process.exit(0);
  }

  if (NEED_LICENSE) {
    try {
      const licenseData = (await fs.readFile('license.dat')).toString().trim();

      const isValid = await license.verifyLicense(
        await machineId(),
        licenseData,
      );

      if (!isValid) {
        throw new Error('INVALID_LICENSE');
      }
    } catch (e) {
      logger.log({
        ts: new Date(),
        pid: process.pid,
        machineId: await machineId(),
        msg: 'INVALID LICENSE',
      });
      process.exit(1);
    }
  }

  if (amqpUrl && amqpExchange) {
    await logger.setAmqp(amqpUrl, amqpExchange);
  }

  app.listen(port, host, async () => {
    logger.log({
      ts: new Date(),
      pid: process.pid,
      msg: 'Ready to served',
      host,
      port,
    });

    if (argv.pidfile) {
      await fs.writeFile(argv.pidfile, process.pid.toString());
    }
  })
    .on('error', (e) => {
      // eslint-disable-next-line no-console
      console.log('EXCEPTION');
      // eslint-disable-next-line no-console
      console.log(`PID: ${process.pid}`);
      // eslint-disable-next-line no-console
      console.log(`ECODE: ${e.code}`);
      // eslint-disable-next-line no-console
      console.log(`EMESSAGE: ${e.message || e.toString()}`);
    });
})();
