# mqtt-km200

##Config

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

