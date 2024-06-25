const crypto = require('crypto');

const generateToken= () => {
  const token = crypto.randomBytes(20).toString('hex');
  return token;
}

module.exports = generateToken;