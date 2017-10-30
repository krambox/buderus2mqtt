# mqtt-km200

##Config

config.yml example

```
km200:
  key: <KEY>
  host: <km200 hostname or ip >
mqtt:
  server: <mqtt connection>
  topic: km200/
measurements:
  - url: '/system/sensors/temperatures/chimney'
    type: 'DPT9.001'
  ...
```


##Scan KM200 

./scan.js

##Key

Generated with https://ssl-account.com/km200.andreashahn.info/

## Docker

    docker build -t km200 .

    docker run --env km200config=/data/config.yml  -v /Volumes/data/smarthome:/data -it km200 
