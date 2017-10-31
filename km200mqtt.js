#!/usr/bin/env node
var request = require('request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');
var mqtt = require('mqtt');
require('require-yaml');

// Load config from path in km200_config
console.log('Starting km200 to mqtt');
if (process.env.km200config == null) {
  console.error('Missing enviroment variable km200config');
  process.exit(-1);
}
console.log('Config file: ' + process.env.km200config);
var config = require(process.env.km200config);
console.log(config);
var key = Buffer.from(config.km200.key, 'hex');
var desEcb = new MCrypt('rijndael-128', 'ecb');
desEcb.open(key);
var km200host = config.km200.host;

var writables = {};

function mnemonizeWritable (result) {
  if (result.writeable === 1) {
    if (writables[result.id] == null) {
      if (result.allowedValues) {
        console.log('Writable: ' + result.id + ' (' + result.type + '): ' + JSON.stringify(result.allowedValues));
      } else {
        console.log('Writable: ' + result.id + ' (' + result.type + '): ' + result.minValue + ' - ' + result.maxValue);
      }
      writables[result.id] = {
        valueType: result.type,
        minValue: result.minValue,
        maxValue: result.maxValue,
        allowedValues: result.allowedValues
      };
    }
  }
}

console.log('Connect mqtt: ' + config.mqtt.server);
var mqttCon = mqtt.connect(config.mqtt.server);

mqttCon.on('connect', () => {
  mqttCon.subscribe('km200/set/#');
});

mqttCon.on('message', (topic, message) => {
  if (topic.startsWith('km200/set/')) {
    let url = topic.substring(9);
    let value = message.toString();
    let writable = writables[url];
    if (writable != null) {
      if (writable.valueType === 'stringValue' && writable.allowedValues.indexOf(value) !== -1) {
        console.log('WRITE: ' + value);
        const postValue = desEcb.encrypt(JSON.stringify({
          value: value
        })).toString('base64');
        var options = {
          url: 'http://' + km200host + url,
          body: postValue,
          headers: {
            'Content-type': 'application/json',
            'User-Agent': 'TeleHeater/2.2.3'
          }
        };
        request.post(options, function (error, response, body) {
          if (!error) {
            getKM200(url, function done () {});
          }
          console.log(error, response.statusCode);
        });
      } else {
        console.log('Invalid valiue: ' + value);
      }
    } else {
      console.log(url + ' not writavle!');
    }
  }
});

function getKM200( url, done) {
  var options = {
    url: 'http://' + km200host + url,
    headers: {
      'Content-type': 'application/json',
      'User-Agent': 'TeleHeater/2.2.3'
    }
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var result = JSON.parse(buffertrim.trimEnd(desEcb.decrypt(Buffer.from(body, 'base64'), 'base64')).toString());
      mnemonizeWritable(result);
      var topic = 'km200/status' + result.id;
      var state = {
        ts: Math.floor(new Date() / 1000),
        val: result.value,
        km200_unitOfMeasure: result.unitOfMeasure
      };
      mqttCon.publish(topic, JSON.stringify(state), { retain: true }, function () {
        // console.log(topic, value);
      });
      done(null);
    } else {
      done(null);
    }
  });
}

function checkKM200() {
  async.eachSeries(config.measurements,
    function (measurement, cb) {
      getKM200(measurement.url, function (done) {
        cb(done);
      });
    },
    function (err, result) {
      if (err) {
        console.error(err);
      }
    }
  );
}

checkKM200();
setInterval(checkKM200, 60000);
