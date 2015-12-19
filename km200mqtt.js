#!/usr/bin/env node
var request = require('request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');
var mqtt    = require('mqtt');

var key = new Buffer('763db139cca921ee370aabcb7be2c530abca1ebdeb741fcf68f5910fd0b77990', 'hex');
var km200host="192.168.1.108";

var mqttCon  = mqtt.connect('mqtt://mac-server.local');

var APIs = [
  	"/gateway/DateTime",
  	"/heatingCircuits/hc1/operationMode",
  	"/heatingCircuits/hc1/temperatureRoomSetpoint",
    "/heatingCircuits/hc1/roomtemperature",
    "/heatingCircuits/hc1/operationMode",
    "/heatSources/actualPower",
    "/heatSources/powerSetpoint",
  	"/heatSources/actualSupplyTemperature",
  	"/heatSources/flameCurrent",
  	"/heatSources/numberOfStarts",
  	"/heatSources/workingTime/totalSystem",
    "/heatSources/workingTime/secondBurner",
    "/heatSources/workingTime/centralHeating",
    "/system/sensors/temperatures/outdoor_t1",
    "/system/sensors/temperatures/chimney",
    "/system/sensors/temperatures/hotWater_t1",
    "/system/sensors/temperatures/supply_t1_setpoint",
    "/system/sensors/temperatures/supply_t1",
    "/dhwCircuits/dhw1/operationMode",
    "/dhwCircuits/dhw1/setTemperature",
    "/dhwCircuits/dhw1/actualTemp",
    "/dhwCircuits/dhw1/operationMode",
    "/dhwCircuits/dhw1/workingTime"
];

var desEcb = new MCrypt('rijndael-128', 'ecb');
desEcb.open(key);

function getKM200(host, api, done) {
    var options = {
    url:  'http://' + host + api,
    headers: {
      'Content-type': 'application/json',
      'User-Agent': 'TeleHeater/2.2.3'
    }
  };
  request.get(options,function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var bodyBuffer = new Buffer(body, 'base64');
      var dataBuffer = buffertrim.trimEnd(desEcb.decrypt(bodyBuffer, 'base64'));
      var result = JSON.parse(dataBuffer.toString());
      mqttCon.publish('km200'+result.id, ""+result.value, {retain: true},function(){
        console.log(result.id,result.value,result.unitOfMeasure);
      });
      done(null);
    }
    else {
      done(null);
    } 
  });
};

function checkKM200() {
  async.eachSeries(APIs, 
    function(api,cb){
      getKM200(km200host, api, function(done){
        cb(done);
      });  
    }, 
    function (err,result) {
    }
  );
};

checkKM200();
var timer = setInterval(checkKM200, 60000);

