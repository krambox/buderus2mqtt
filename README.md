# mqtt-km200

## Config

config.yml example

```
measurements:
  - url: '/system/sensors/temperatures/chimney'
  - url: '/system/sensors/temperatures/outdoor_t1'
  - url: '/system/sensors/temperatures/supply_t1_setpoint'
  - url: '/heatSources/actualSupplyTemperature'
  - url: '/heatingCircuits/hc1/temperatureLevels/day'
  - url: '/heatingCircuits/hc1/temperatureLevels/night'
  - url: '/heatingCircuits/hc1/roomtemperature'
  - url: '/heatingCircuits/hc1/temperatureRoomSetpoint'
  - url: '/dhwCircuits/dhw1/actualTemp'
  - url: '/dhwCircuits/dhw1/setTemperature'
  - url: '/system/appliance/workingTime/centralHeating'
  - url: '/system/appliance/workingTime/secondBurner'
  - url: '/system/appliance/workingTime/totalSystem'
  - url: '/dhwCircuits/dhw1/workingTime'
  - url: '/system/appliance/numberOfStarts'
  - url: '/system/appliance/fanSpeed'
  - url: '/system/appliance/flameCurrent'
  - url: '/system/appliance/actualPower'
  - url: '/system/appliance/powerSetpoint'
  - url: '/dhwCircuits/dhw1/waterFlow'
```

Env file

```
KM200_url=mqtt://192.168.1.13
KM200_config=./config.yml
KM200_passcode=<KEY generated with https://ssl-account.com/km200.andreashahn.info/ >
KM200_km200=192.168.1.162
```

## Scan KM200 

Scans all readings from km200 write a table to std out. 

Example for Buderus GB 135

./scan.js -p <KEY generated with https://ssl-account.com/km200.andreashahn.info/ > -k 192.168.1.162 > gb135.txt

## Start

./km200mqtt.js -u mqtt://192.168.1.13 -k 192.168.1.162 -p <KEY>

## Key

Generated with https://ssl-account.com/km200.andreashahn.info/

## Docker

    docker build -t km200 .

    docker run --env km200config=/data/config.yml  -v /Volumes/data/smarthome:/data -it km200 
