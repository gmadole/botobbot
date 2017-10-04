var fs = require('fs');

module.exports.fixture = {
  read(name) {
    return JSON.parse(fs.readFileSync(`${__dirname}/fixtures/${name}.json`, 'utf8'));
  }
}
