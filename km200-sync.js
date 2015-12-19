var request = require('sync-request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');
var sleep = require('sleep').sleep;
var yaml_config = require('node-yaml-config');

var config = yaml_config.load(__dirname + '/config.yml');
var key = new Buffer(config.key, 'hex');

var APIs = [
  	"/gateway/DateTime",
  	"/heatingCircuits/hc1/roomtemperature",
    "/heatingCircuits/hc1/status",
  	"/heatSources/actualPower",
  	"/heatSources/actualCHPower",
  	"/heatSources/actualDHWPower",
  	"/heatSources/actualSupplyTemperature",
  	"/heatSources/flameCurrent",
  	"/heatSources/numberOfStarts",
  	"/heatSources/powerSetpoint",
  	"/heatSources/nominalCHPower",
  	"/heatSources/nominalDHWPower",
  	"/heatSources/workingTime/totalSystem",
    "/heatSources/workingTime/secondBurner",
    "/heatSources/workingTime/centralHeating",
    "/system/sensors/temperatures/outdoor_t1",
    "/system/sensors/temperatures/chimney",
    "/system/sensors/temperatures/hotWater_t1",
    "/dhwCircuits/dhw1/workingTime",
    "/dhwCircuits/dhw1/actualTemp",
    "/dhwCircuits/dhw1/setTemperature"
];

var desEcb = new MCrypt('rijndael-128', 'ecb');
desEcb.open(key);

function getKM200(host, api) {
  var response = request('GET', 'http://' + host + api,{
    headers: {
      'Content-type': 'application/json',
      'User-Agent': 'TeleHeater/2.2.3'
    }}
  );
  if (response.statusCode == 200) {
    var bodyBuffer = new Buffer(response.body.toString(),'base64');
    var dataBuffer = buffertrim.trimEnd(desEcb.decrypt(bodyBuffer, 'base64'));
    return JSON.parse(dataBuffer.toString());
  }
};

//while (true) {
  var line="";
  
  for (var i=0; i < APIs.length; i++) {
    var result = getKM200(host,APIs[i]);
      line += result.value;
    line += ";"
    console.log(result.id,result.value,result.unitOfMeasure); 
  } 
  //console.log(line);
  //sleep(10);
//}
