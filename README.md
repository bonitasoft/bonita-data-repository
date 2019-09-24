# BDM repository server

## Installation

```
$ npm install
```

## Start the server

```
$ npm run start
Server is running on http://localhost:4000
```

Start the server with a BDM:

```
$ node src/server.js bdmFile=YOUR_PATH/bdm_simple.xml
```

### Options

|     Options     |                              Description                              |                Example                |  Default value   |
| :-------------: | :-------------------------------------------------------------------: | :-----------------------------------: | :--------------: |
|     config      |                To run server with a config file (json)                |    config=config/development.json     |                  |
|     bdmFile     |                    File to load on server starting                    |       bdmFile=yourPath/bom.xml        |                  |
|      host       |                       Start server on this host                       |             host=0.0.0.0              |    127.0.0.1     |
|      port       |                       Start server on this port                       |               port=5000               |       4000       |
| healthCheckHost | Host healCheck. If option not found, server work without healthCheck  |   healthCheckHost=http://localhost    | http://localhost |
| healthCheckUrl  | Url healthCheck. If option not found, server work without healthCheck | healthCheckUrl=/api/workspace/status/ |                  |
| healthCheckPort | Port healCheck. If option not found, server work without healthCheck  |         healthCheckPort=5050          |                  |
|    logLevel     |               Level for log (error, warn, info, debug)                |            logLevel=debug             |       info       |
|     logFile     |                Output file for logs. One file per day                 |         logFile=./logs/myLog/         |     ./logs/      |

Each option can be given on server start command. Config parameter will be always override file configuration.

Example of config file:

```
{
  "port": "5000",
  "bdmFile": "resources/bomSimple.xml",
  "logLevel": "warn",
  "logfile": "./logs"
}
```

## Connect to GraphiQL

```
http://localhost:4000/bdr
```

## Post a BDM (from string)

```
$ curl -v -H "Content-Type: application/json" localhost:4000/bdm -d '{"bdmXml": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?> <businessObjectModel modelVersion=\"1.0\" productVersion=\"7.10.0-SNAPSHOT\"> <businessObjects> <businessObject qualifiedName=\"com.company.model.BusinessObject1\"> <fields> <field type=\"STRING\" length=\"255\" name=\"attribute1\" nullable=\"true\" collection=\"false\"/> </fields> <uniqueConstraints/> <queries/> <indexes/> </businessObject> </businessObjects> </businessObjectModel>"}'
```
