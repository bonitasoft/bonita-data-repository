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

import { Configuration } from './Configuration';

const winston = require('winston');
import { BdrServer } from './BdrServer';
import { ConfigurationManager } from './ConfigurationManager';
import { BdrLogger } from '../logger/BdrLogger';

// Configure no proxy setting
process.env['NO_PROXY'] = '127.0.0.1,localhost';

// Handle server parameters
let config: Configuration = new ConfigurationManager(process.argv).getConfig();

BdrLogger.init(config);
let logger = winston.loggers.get('bo-logger');

const bdrServer = new BdrServer(config);

/**
 * Create Express routes
 */

bdrServer.addGraphqlRoute();
bdrServer.addBdmPostRoute();
bdrServer.addBdmJsonRoute();
bdrServer.addBdmDeleteRoute();
bdrServer.addBdmGetStatusRoute();

/**
 * Start Server
 */

bdrServer.start();

/**
 * Start HealthCheck
 */
bdrServer.startHealthCheckIfNeeded();

logger.info(
  '\n' +
    '________          __                                                      .__  __                       \n' +
    '\\______ \\ _____ _/  |______            _______   ____ ______   ____  _____|__|/  |_  ___________ ___.__.\n' +
    ' |    |  \\\\__  \\\\   __\\__  \\    ______ \\_  __ \\_/ __ \\\\____ \\ /  _ \\/  ___/  \\   __\\/  _ \\_  __ <   |  |\n' +
    ' |    `   \\/ __ \\|  |  / __ \\_ /_____/  |  | \\/\\  ___/|  |_> >  <_> )___ \\|  ||  | (  <_> )  | \\/\\___  |\n' +
    '/_______  (____  /__| (____  /          |__|    \\___  >   __/ \\____/____  >__||__|  \\____/|__|   / ____|\n' +
    '        \\/     \\/          \\/                       \\/|__|              \\/                       \\/     \n'
);
logger.debug(`Server is starting with following config ${JSON.stringify(config)}`);
logger.info(
  `Server is running on http://${bdrServer.getHost()}:${bdrServer.getPort()}${BdrServer.getBdmGraphqlPath()}`
);
