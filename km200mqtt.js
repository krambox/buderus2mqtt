#!/usr/bin/env node
var request = require('request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');
var mqtt = require('mqtt');
require('require-yaml');

console.log('Starting km200 to mqtt');
console.log(process.env.km200_config);
var config = require(process.env.km200config);
console.log(config);

var key = Buffer.from(config.km200.key, 'hex');
var km200host = config.km200.host;

console.log('Connect mqtt: ' + config.mqtt.server);
var mqttCon = mqtt.connect(config.mqtt.server);

var desEcb = new MCrypt('rijndael-128', 'ecb');
desEcb.open(key);

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
        type: result.type,
        minValue: result.minValue,
        maxValue: result.maxValue,
        allowedValues: result.type
      };
    }
  }
}

function getKM200 (host, measurement, done) {
  var options = {
    url: 'http://' + host + measurement.url,
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

function checkKM200 () {
  async.eachSeries(config.measurements,
    function (measurement, cb) {
      getKM200(km200host, measurement, function (done) {
        cb(done);
      });
    },
    function (err, result) {
      console.log(err);
    }
  );
}

checkKM200();
setInterval(checkKM200, 60000);
