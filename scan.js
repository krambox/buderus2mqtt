#!/usr/bin/env node
var request = require('request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');

require('require-yaml');
var config = require('./config.yml');

console.log(__dirname + '/config.yml');
console.log(config);

var key = Buffer.from(config.km200.key, 'hex');

var host = config.km200.host;

var APIs = [
  '/gateway',
  '/system',
  '/heatSources',
  '/recordings',
  '/notifications',
  '/heatingCircuits',
  '/solarCircuits',
  '/dhwCircuits'
];

var desEcb = new MCrypt('rijndael-128', 'ecb');
desEcb.open(key);

function getKM200 (host, api, done) {
  var options = {
    url: 'http://' + host + api,
    headers: {
      'Content-type': 'application/json',
      'User-Agent': 'TeleHeater/2.2.3'
    }
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      try {
        var bodyBuffer = Buffer.from(body, 'base64');
        var dataBuffer = buffertrim.trimEnd(desEcb.decrypt(bodyBuffer, 'base64'));
        // console.log(api,dataBuffer.toString())
        var result = JSON.parse(dataBuffer.toString());
        done(dataBuffer.toString(), result);
      } catch (e) {
        done({ error: e });
      }
    } else {
      done({ error: error, statusCode: response.statusCode });
    }
  });
}

function callKM200 (host, APIs) {
  var API = APIs.shift();
  getKM200(host, API, function (result, json) {
    console.error(API, APIs.length);
    if (json === undefined) {
      console.log(API, '-');
    } else if (json && json.hasOwnProperty('type') && json.type == 'refEnum') {
      json.references.forEach(function (e) {
        APIs.unshift(e.id);
      });
    } else if (json.type === 'yRecording') {
      console.log(API, 'yRecording');
    } else if (json.type === 'switchProgram') {
      console.log(API, 'switchProgram');
    } else if (json.type === 'errorList') {
      console.log(API, 'errorList');
    } else if (json && json.hasOwnProperty('value')) {
      console.log(API, json.id, json.type, json.value,
        json.unitOfMeasure !== undefined ? json.unitOfMeasure : '',
        json.writeable === 1 ? 'writable' : '',
        json.recordable === 1 ? 'recordable' : '',
        json.minValue !== undefined ? '[' + json.minValue + ', ' : '[',
        json.maxValue !== undefined ? json.maxValue + ']' : ']');
      if (json.allowedValues) {
        console.log('===============');
        console.log(json.allowedValues);
        console.log('===============');
      }
    } else {
      console.log('===============');
      console.log(API);
      console.log('===============');
      console.log(json);
    }
    // console.log(APIs.length);

    if (APIs.length) {
      callKM200(host, APIs);
    }
  });
}

callKM200(host, APIs);
