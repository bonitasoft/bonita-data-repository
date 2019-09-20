/*
 * Copyright © 2019 Bonitasoft S.A.
 * Bonitasoft, 32 rue Gustave Eiffel - 38000 Grenoble
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const xmlParser = require('xml-js');
const bodyParser = require('body-parser');
const fs = require('fs');
const winston = require('winston');
let StudioHealthCheck = require('./StudioHealthCheck');
const ManageParameters = require('./ManageParameters');
const Logger = require('../logger/logger');
const GraphqlSchemaGenerator = require('../schema/GraphqlSchemaGenerator');

// Handle server parameters
let config = ManageParameters.buildConfig(process.argv);

// Port default value
let port = config.port || 4000;

/**
 * LOGGER
 */
Logger.init(config);
let logger = winston.loggers.get('bo-logger');

/**
 * Build graphQL schema
 */
function getSchema(bdmXml) {
  let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
  let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
  schemaGenerator.generate();
  return buildSchema(schemaGenerator.getSchema());
}

let schema = buildSchema('type Query { content: String }');
if (config.bdmFile) {
  let bdmXml = fs.readFileSync(config.bdmFile, 'utf8');
  schema = getSchema(bdmXml);
  logger.info(`BDM added:  ${config.bdmFile}`);
}

const resolvers = {
  Query: {}
};

let app = express();

/**
 * Create Express routes
 */

function removeGraphqlRoute() {
  let routes = app._router.stack;
  routes.forEach(removeMiddlewares);

  function removeMiddlewares(route, i, routes) {
    if (route.handle.name === 'graphqlMiddleware') {
      routes.splice(i, 1);
    }
    if (route.route) {
      route.route.stack.forEach(removeMiddlewares);
    }
  }
}

function addBdrRoute(graphqlSchema) {
  app.use(
    '/bdr',
    graphqlHTTP({
      schema: graphqlSchema,
      rootValue: resolvers,
      graphiql: true
    })
  );
}

addBdrRoute(schema);

// Tell Express to parse application/json
app.use(bodyParser.json());

app.post('/bdm', function(req, res) {
  logger.info('BDM pushed.');
  let newSchema = getSchema(req.body.bdmXml);
  removeGraphqlRoute();
  addBdrRoute(newSchema);
  res.send();
});

/**
 * Attach and call HealthCheck if parameter has attach for server parameter
 * @constructor
 */
function DoHealthCheck(config) {
  if (config.healthCheckUrl && config.healthCheckPort) {
    logger.info('Listen studio health check connection');
    let studioHealthCheck = new StudioHealthCheck(config.healthCheckUrl, config.healthCheckPort);
    studioHealthCheck.healthCheckWithInterval(20000);
  } else {
    logger.info('Running without health check.');
  }
}

/**
 * RUN Server
 */

app.listen(port);

logger.info(
  '\n' +
    '________          __                                                      .__  __                       \n' +
    '\\______ \\ _____ _/  |______            _______   ____ ______   ____  _____|__|/  |_  ___________ ___.__.\n' +
    ' |    |  \\\\__  \\\\   __\\__  \\    ______ \\_  __ \\_/ __ \\\\____ \\ /  _ \\/  ___/  \\   __\\/  _ \\_  __ <   |  |\n' +
    ' |    `   \\/ __ \\|  |  / __ \\_ /_____/  |  | \\/\\  ___/|  |_> >  <_> )___ \\|  ||  | (  <_> )  | \\/\\___  |\n' +
    '/_______  (____  /__| (____  /          |__|    \\___  >   __/ \\____/____  >__||__|  \\____/|__|   / ____|\n' +
    '        \\/     \\/          \\/                       \\/|__|              \\/                       \\/     \n'
);
DoHealthCheck(config);
logger.debug(`Server is starting with following config ${JSON.stringify(config)}`);
logger.info(`Server is running on http://localhost:${port}/bdr`);
