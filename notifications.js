#!/usr/bin/env node
var request = require('request')
var MCrypt = require('mcrypt').MCrypt
var buffertrim = require('buffertrim')

var config = require('yargs')
  .env('KM200')
  .usage('Scans a KM200 API\n\nUsage: $0 [options]')
  .describe('p', 'KM200 passcode')
  .describe('k', 'KM200 host')
  .describe('h', 'show help')
  .alias({
    h: 'help',
    k: 'km200',
    p: 'passcode'
  })
  .default({})
  .version()
  .help('help').argv

var Table = require('cli-table')
var table = new Table({
  head: ['cat', 'act', 'dcd', 'ccd', 'orig', 'Time']
  //colWidths: [60, 16, 25, 10, 6, 6, 6, 12, 80]
})

var key = Buffer.from(config.passcode, 'hex')
var host = config.km200

var desEcb = new MCrypt('rijndael-128', 'ecb')
desEcb.open(key)

function getKM200(host, api, done) {
  var options = {
    url: 'http://' + host + api,
    headers: {
      'Content-type': 'application/json',
      'User-Agent': 'TeleHeater/2.2.3'
    }
  }
  request.get(options, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      try {
        var bodyBuffer = Buffer.from(body, 'base64')
        var dataBuffer = buffertrim.trimEnd(desEcb.decrypt(bodyBuffer, 'base64'))
        var result = JSON.parse(dataBuffer.toString())
        done(dataBuffer.toString(), result)
      } catch (e) {
        done({ error: e })
      }
    } else {
      done({ error: error })
    }
  })
}

function strcmp(a, b) {
  if (a.toString() < b.toString()) return -1
  if (a.toString() > b.toString()) return 1
  return 0
}

function requestKM200(host) {
  getKM200(host, '/notifications', function(result, json) {
    if (json !== undefined) {
      //console.log(JSON.stringify(json.values))
      var data = json.values

      data.sort(function(a, b) {
        if (a.t && !b.t) return 0
        if (!a.t) return -1
        if (!b.t) return 1
        if (a.t < b.t) return 1
        if (a.t > b.t) return -1
        return 0
      })

      for (let index = 0; index < data.length; index++) {
        const element = data[index]
        var entry = [
          optionalTableString(element.cat),
          optionalTableString(element.act),
          optionalTableString(element.dcd),
          optionalTableString(element.ccd),
          optionalTableString(element.orig),
          optionalTableString(element.t)
        ]
        table.push(entry)
      }
      console.log(table.toString())
    }
  })
}

function optionalTableString(element) {
  if (element === undefined) return ''
  else if (Array.isArray(element)) return JSON.stringify(element)
  else return JSON.stringify(element)
}

requestKM200(host)
