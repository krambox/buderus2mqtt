#!/usr/bin/env node
var request = require('request');
var async = require('async');
var MCrypt = require('mcrypt').MCrypt;
var buffertrim = require('buffertrim');

var key = new Buffer('763db139cca921ee370aabcb7be2c530abca1ebdeb741fcf68f5910fd0b77990', 'hex');

var host="192.168.2.162";

var APIs = [
  
  	"/gateway",
  	"/heatingCircuits",
    "/heatSources",
    "/system",
    "/solarCircuits",
    "/dhwCircuits"
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
      try{
        var bodyBuffer = new Buffer(body, 'base64');
        var dataBuffer = buffertrim.trimEnd(desEcb.decrypt(bodyBuffer, 'base64'));
        //console.log(api,dataBuffer.toString());
        var result = JSON.parse(dataBuffer.toString());
        done(dataBuffer.toString(),result);
      }catch(e){
        done({error: e});
      }
    }
    else {
      done({error: error, statusCode: response.statusCode});
    } 
  });
};

function callKM200( host, APIs ) {
  var API = APIs.shift();
  //console.log(API);
  getKM200(host, API, function(result,json) {
    //console.log(result); 
    if (json && json.hasOwnProperty('type') && json.type == 'refEnum') {
      json.references.forEach(function (e) {
        APIs.push(e.id);
      });
    }
    else if (json && json.hasOwnProperty('value')){
      console.log(json.id,json.type,json.value,json.unitOfMeasure);
      //console.log(json);
    }
    //console.log(APIs.length); 

    if( APIs.length ) {
      callKM200( host, APIs );
    }
  });
}

callKM200( host, APIs );