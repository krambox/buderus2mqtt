var pkg = require('./package.json');
var config = require('yargs')
  .env('KM200')
  .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
  .describe('v', 'possible values: "error", "warn", "info", "debug"')
  .describe('n', 'instance name. used as mqtt client id and as prefix for connected topic')
  .describe('u', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
  .describe('p', 'KM200 passcode')
  .describe('k', 'KM200 host')
  .describe('c', 'KM200 measurment file')
  .describe('h', 'show help')
  .alias({
    'h': 'help',
    'n': 'name',
    'u': 'url',
    'k': 'km200',
    'p': 'passcode',
    'c': 'config',
    'v': 'verbosity'
  })
  .default({
    'u': 'mqtt://127.0.0.1',
    'n': 'km200',
    'v': 'info',
    'c': './config.yml'
  })
  .version()
  .help('help')
  .argv;

module.exports = config;
