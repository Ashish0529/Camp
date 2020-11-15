const crypto = require('crypto');

const getToken = async (length =  20) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, function(err, buf) {
      if (err) reject(err);
      const token = buf.toString('hex');
      resolve(token);
    })
  })
};

module.exports = {
  getToken
};