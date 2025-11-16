const path = require('path');
const fs = require('fs');

if (typeof process.env.DOTENV_HIDE_SUCCESS === 'undefined') {
  process.env.DOTENV_HIDE_SUCCESS = 'true';
}

const dotenv = require('dotenv');

const envFiles = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

envFiles.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

module.exports = process.env;
