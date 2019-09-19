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

|     Options     |                              Description                              |            Example             | Default value |
| :-------------: | :-------------------------------------------------------------------: | :----------------------------: | :-----------: |
|     config      |                To run server with a config file (json)                | config=config/development.json |               |
|     bdmFile     |                    File to load on server starting                    |    bdmFile=yourPath/bom.xml    |               |
|      port       |                       Start sever on this port                        |           port=5000            |     4000      |
| healthCheckUrl  | Url healthCheck. If option not found, server work without healthCheck | healthCheckUrl=/api/workspace  |               |
| healthCheckPort | Port healCheck. If option not found, server work without healthCheck  |      healthCheckPort=5050      |               |
|    logLevel     |               Level for log (error, warn, info, debug)                |         logLevel=debug         |     info      |
|     logFile     |                Output file for logs. One file per day                 |     logFile=./logs/myLog/      |    ./logs/    |

Each option can be given on server start command. Config parameter will be always override file configuration.

## Connect to GraphQL Playground

Open the above url from your favorite browser!

Click on the 'DOCS' tab to check the schema documentation.

Enter queries on the left panel.

Click on 'COPY CURL' to get the corresponding curl command

## Query Samples

### Add a BDM from file

Add the _bomQueensland.xml_ BDM (from curl only, not possible from the Playground)

```
curl localhost:4000/repository   -F operations='{ "query": "mutation ($file: Upload!) { postFile(file: $file) }", "variables": { "file": null } }'   -F map='{ "0": ["variables.file"] }'   -F 0=@bomQueensland.xml
```

### Add a BDM from string

From the Playground:

```
mutation {
  post(description: "bdm sample", content: "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><businessObjectModel modelVersion=\"1.0\" productVersion=\"7.10.0-SNAPSHOT\"> <businessObjects> <businessObject qualifiedName=\"com.company.model.obj1\"> <fields> <field type=\"STRING\" length=\"255\" name=\"attribute1\" mandatory=\"true\" multiple=\"false\"/> </fields> <uniqueConstraints/> <queries/> <indexes/> </businessObject> </businessObjects> </businessObjectModel>")
}


```

### Get the added BDM

```
query {
  bdm {
    description
    content
  }
}
```

### Get the BDM tree

```
query {
  bdmTree {
    name
    productVersion
    modelVersion
    nodes {
      qualifiedName
      name
      children {
        ... bdmTreeItem
      }
    }
  }
}

fragment bdmTreeItem on BdmTreeItem {
  ... on BdmRelationObject {
    ... bdmRelationObjectFields
    children {
      ... on BdmRelationObject {
        ...bdmRelationObjectFields
        children {
          ... on BdmRelationObject {
            ...bdmRelationObjectFields
            children {
              ... on BdmRelationObject {
                ...bdmRelationObjectFields
              }
              ... on BdmAttribute {
                ...bdmAttributeFields
              }
            }
          }
          ... on BdmAttribute {
            ...bdmAttributeFields
          }
        }
      }
      ... on BdmAttribute {
        ...bdmAttributeFields
      }
    }
  }
  ... on BdmAttribute {
    ...bdmAttributeFields
  }
}

fragment bdmRelationObjectFields on BdmRelationObject {
  name
  reference
  relationType
  fetchType
  mandatory
  multiple
}

fragment bdmAttributeFields on BdmAttribute {
  name
  type
  length
  mandatory
  multiple
}

```

### Get the BDM tree as String

```
query {
  bdmTreeAsString {
    name
    content
  }
}
```
