#!/usr/bin/env node
var pkg = require('./package.json');
var request = require('request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');
var Mqtt = require('mqtt');
var log = require('yalm');
var config = require('./config.js');
require('require-yaml');

var mqttConnected;

log.setLevel(config.verbosity);

log.info(pkg.name + ' ' + pkg.version + ' starting');
log.info('mqtt trying to connect', config.url);

var mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0', retain: true}});

mqtt.on('connect', function () {
  mqttConnected = true;

  log.info('mqtt connected', config.url);
  mqtt.publish(config.name + '/connected', '1', {retain: true}); // TODO eventually set to '2' if target system already connected

  log.info('mqtt subscribe', config.name + '/set/#');
  mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', function () {
  if (mqttConnected) {
    mqttConnected = false;
    log.info('mqtt closed ' + config.url);
  }
});

mqtt.on('error', function (err) {
  log.error('mqtt', err);
});

log.info('Config file: ' + config.config);
var measurements = require(config.config).measurements;
log.debug(measurements);
var key = Buffer.from(config.passcode, 'hex');
log.debug(key);
var desEcb = new MCrypt('rijndael-128', 'ecb');
desEcb.open(key);
var km200host = config.km200;
log.info(km200host);

var writables = {};

function mnemonizeWritable (result) {
  if (result.writeable === 1) {
    if (writables[result.id] == null) {
      if (result.allowedValues) {
        log.info('Writable: ' + result.id + ' (' + result.type + '): ' + JSON.stringify(result.allowedValues));
      } else {
        log.info('Writable: ' + result.id + ' (' + result.type + '): ' + result.minValue + ' - ' + result.maxValue);
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

mqtt.on('message', (topic, message) => {
  if (topic.startsWith('km200/set/')) {
    let url = topic.substring(9);
    let value = message.toString();
    let writable = writables[url];
    if (writable != null) {
      if ((writable.valueType === 'stringValue' && writable.allowedValues.indexOf(value) !== -1) ||
        (writable.valueType === 'floatValue' && parseFloat(value) >= writable.minValue && parseFloat(value) <= writable.maxValue)) {
        log.info('WRITE: ' + value);
        const postValue = desEcb.encrypt(JSON.stringify({
          value: writable.valueType === 'stringValue' ? value : parseFloat(value)
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
          log.info(error, response.statusCode);
        });
      } else {
        log.info('Invalid valiue: ' + value);
      }
    } else {
      log.info(url + ' not writavle!');
    }
  }
});

function getKM200 (url, done) {
  var options = {
    url: 'http://' + km200host + url,
    headers: {
      'Content-type': 'application/json',
      'User-Agent': 'TeleHeater/2.2.3'
    }
  };
  log.debug(options);
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
      mqtt.publish(topic, JSON.stringify(state), { retain: true }, function () {
        // log.info(topic, value)
      });
      done(null);
    } else {
      done(null);
    }
  });
}

function checkKM200 () {
  async.eachSeries(measurements,
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
