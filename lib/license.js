// const JWT_ALGO = 'RS256';
const JWT_ALGO = 'ES256';

const jwt = require('jsonwebtoken');

// See https://techdocs.akamai.com/iot-token-access-control/docs/generate-rsa-keys
// See https://techdocs.akamai.com/iot-token-access-control/docs/generate-ecdsa-keys

let config;
try {
  // eslint-disable-next-line global-require
  config = require('../build-config.json');
} catch (e) {
  config = {};
}

const generateLicense = async (machineId) => {
  if (!config.privateKey) {
    return null;
  }

  const result = jwt.sign({ machineId }, config.privateKey, { algorithm: JWT_ALGO });
  return result;
};
exports.generateLicense = generateLicense;

const verifyLicense = async (machineId, licenseData) => {
  try {
    const result = jwt.verify(licenseData, config.publicKey);
    if (!result) return false;

    return result && result.machineId === machineId;
  } catch (e) {
    return false;
  }
};
exports.verifyLicense = verifyLicense;
