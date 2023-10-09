// const JWT_ALGO = 'RS256';
const JWT_ALGO = 'ES256';

const jwt = require('jsonwebtoken');

// See https://techdocs.akamai.com/iot-token-access-control/docs/generate-rsa-keys
// See https://techdocs.akamai.com/iot-token-access-control/docs/generate-ecdsa-keys

let privateKey;
let publicKey;
try {
  // eslint-disable-next-line global-require
  privateKey = require('../private.json');
  // eslint-disable-next-line global-require
  publicKey = require('../public.json');
} catch (e) {
  //
}

const generateLicense = async (machineId) => {
  if (!privateKey?.key) {
    return null;
  }

  const result = jwt.sign({ machineId }, privateKey?.key, { algorithm: JWT_ALGO });
  return result;
};
exports.generateLicense = generateLicense;

const verifyLicense = async (machineId, licenseData) => {
  try {
    const result = jwt.verify(licenseData, publicKey?.key);
    if (!result) return false;

    return result && result.machineId === machineId;
  } catch (e) {
    return false;
  }
};
exports.verifyLicense = verifyLicense;
