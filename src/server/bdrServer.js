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
const { GraphQLServer } = require('graphql-yoga');
const fs = require('fs');
let xmlParser = require('xml-js');
let GraphqlSchemaGenerator = require('../schema/GraphqlSchemaGenerator');
let StudioHealthCheck = require('./StudioHealthCheck');
let ManageParameters = require('./ManageParameters');
const Logger = require('../logger/logger');
const winston = require('winston');

let port = 4000;
// Handle server parameters
let config = ManageParameters.buildConfig(process.argv);

/**
 * LOGGER
 */
Logger.init(config);
let logger = winston.loggers.get('bo-logger');

let bdmContentXml = '';
if (config.bdmFile) {
  bdmContentXml = fs.readFileSync(config.bdmFile, 'utf8');
  logger.info(`BDM added:  ${config.bdmFile}`);
}

let bdm = {
  description: 'Bonitasoft BDM',
  content: bdmContentXml
};

let bdmContentJson = xmlParser.xml2json(bdm.content, { compact: true, spaces: 4 });

let schemaGenerator = new GraphqlSchemaGenerator(bdmContentJson);
schemaGenerator.generate();
let schema = schemaGenerator.getSchema();

const resolvers = {
  Query: {}
};

const server = new GraphQLServer({
  typeDefs: schema,
  resolvers
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
server.start({ port: port, endpoint: '/repository' }, () => {
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
  logger.info(`Server is running on http://localhost:${port}`);
});
