# Bonita Data Repository server

## Build / Test / Installation

```
$ mvn clean install
```

## Start the server

```
$ npm run start
Server is running on http://localhost:4000
```

Start the server with a BDM:

```
$ node target/src/server/starter.js bdmFile=YOUR_PATH/bdm_simple.xml
or
$ npm run start
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

Example of dev config file:

```
{
  "port": "5000",
  "bdmFile": "resources/bomSimple.xml",
  "logLevel": "warn",
  "logfile": "./logs"
}
```

To simulate 'production' environment, don't forget to add healthCheck information. You can see an example in config/production.json file.

## Connect to GraphiQL

```
http://localhost:4000/bdm/graphql
```

## Get the BDM json representation

```
http://localhost:4000/bdm/json
```

## Get the graphical view (Voyager)

```
http://localhost:4000/bdm/graphical
```

## Post a BDM (from string)

```
$ curl -H "Content-Type: application/json" localhost:4000/bdm -d '{"bdmXml": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?> <businessObjectModel modelVersion=\"1.0\" productVersion=\"7.10.0-SNAPSHOT\"> <businessObjects> <businessObject qualifiedName=\"com.company.model.BusinessObject1\"> <fields> <field type=\"STRING\" length=\"255\" name=\"attribute1\" nullable=\"true\" collection=\"false\"/> </fields> <uniqueConstraints/> <queries/> <indexes/> </businessObject> </businessObjects> </businessObjectModel>"}'
```

## Delete a BDM

Reset the repository in its initial state (with no BDM)

```
curl -X DELETE localhost:4000/bdm
```

## Get the server status

```
http://localhost:4000/bdm/status
```

Provides the server status, for json requests and GraphQL requests.  
For instance:

```
{"jsonRequest":true,"graphqlRequest":true}
```

## Branching strategy

This repository follows the [GitFlow branching strategy](https://gitversion.net/docs/learn/branching-strategies/gitflow/examples).

## Release

To release a new version, maintainers may use the Release and Publication GitHub actions.

1. [Release action](https://github.com/bonitasoft/bonita-asciidoc-templating/actions/workflows/release.yml) will invoke the `gitflow-maven-plugin` to perform all required merges, version updates and tag creation.
2. [Publication action](https://github.com/bonitasoft/bonita-asciidoc-templatingl/actions/workflows/publish.yml) will build and deploy a given tag to bonitasoft.jfrog.io/artifactory.
3. A GitHub release should be created and associated to the tag.
