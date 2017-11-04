#!/usr/bin/env node
var request = require('request');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');

require('require-yaml');
var config = require('./config.yml');

console.error(__dirname + '/config.yml');
console.error(config);

var Table = require('cli-table');
var table = new Table({
  head: ['id', 'type', 'value','unit','Rec','Write','min','max','values'],
  colWidths: [60, 16, 25, 10, 6, 6, 6, 12, 80]
});

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
      done({ error: error });
    }
  });
}

function callKM200 (host, APIs) {
  var API = APIs.shift();
  getKM200(host, API, function (result, json) {
    console.error(API, APIs.length);
    if (json !== undefined && json.type!=='refEnum') {
      var entry = [
        json.id ? json.id :'',
        json.type ? json.type :'',
        json.value ? json.value :'',
        json.unitOfMeasure ? json.unitOfMeasure :'',
        json.recordable ? json.recordable :'',
        json.writeable ? json.writeable :'',
        json.minValue ? json.minValue :'',
        json.maxValue ? json.maxValue :'',
        json.allowedValues ? JSON.stringify(json.allowedValues) : ''
      ];
      table.push(entry);
    }
    if (json !== undefined && json.type!=='refEnum' && json.value===undefined) {
      console.error(json);
    }
    if (json && json.hasOwnProperty('type') && json.type == 'refEnum') {
      json.references.forEach(function (e) {
        APIs.unshift(e.id);
      });
    }

    if (APIs.length) {
      callKM200(host, APIs);
    } else {
      console.log(table.toString());
    }
  });
}

callKM200(host, APIs);
