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
const winston = require('winston');
const fs = require('fs');
const { buildSchema } = require('graphql');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const bodyParser = require('body-parser');
const xmlParser = require('xml-js');
const GraphqlSchemaGenerator = require('../schema/GraphqlSchemaGenerator');
let StudioHealthCheck = require('./StudioHealthCheck');

class BdrServer {
  constructor(config) {
    if (!config) {
      throw 'Missing server config';
    }
    // Port default value
    this.config = config;
    this.port = config.port || 4000;
    this.host = config.host || '127.0.0.1';
    this.graphqlPath = '/bdr';
    this.logger = winston.loggers.get('bo-logger');
    this.schema = this._buildInitialGraphqlSchema();
    this.resolvers = {
      Query: {}
    };
    this.expressApp = express();
    // Tell Express to parse application/json
    this.expressApp.use(bodyParser.json());
  }

  start() {
    this.expressApp.listen(this.port, this.host);
  }

  getPort() {
    return this.port;
  }

  getHost() {
    return this.host;
  }

  getGraphqlPath() {
    return this.graphqlPath;
  }

  getExpressApp() {
    return this.expressApp;
  }

  getSchema() {
    return this.schema;
  }

  startHealthCheckIfNeeded() {
    if (this.config.healthCheckUrl && this.config.healthCheckPort) {
      this.logger.info('Listen Studio health check connection');
      let studioHealthCheck = new StudioHealthCheck(
        this.config.healthCheckHost,
        this.config.healthCheckUrl,
        this.config.healthCheckPort
      );
      studioHealthCheck.healthCheckWithInterval(20000);
    } else {
      this.logger.info('Running without health check.');
    }
  }

  addGraphqlRoute() {
    this.expressApp.use(
      this.graphqlPath,
      graphqlHTTP({
        schema: this.schema,
        rootValue: this.resolvers,
        graphiql: true
      })
    );
  }

  addBdmPostRoute() {
    let myself = this;
    this.expressApp.post('/bdm', function(req, res) {
      myself.logger.info('BDM pushed.');
      myself._handleNewBdmXml(req.body.bdmXml);
      res.send();
    });
  }

  _buildInitialGraphqlSchema() {
    let schema = buildSchema('type Query { content: String }');
    if (this.config.bdmFile) {
      let bdmXml = fs.readFileSync(this.config.bdmFile, 'utf8');
      schema = this._getSchema(bdmXml);
      this.logger.info(`BDM added:  ${this.config.bdmFile}`);
    }
    return schema;
  }

  _getSchema(bdmXml) {
    let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
    let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
    schemaGenerator.generate();
    return buildSchema(schemaGenerator.getSchema());
  }

  _removeGraphqlRoute() {
    let routes = this.expressApp._router.stack;
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

  _handleNewBdmXml(bdmXml) {
    let newSchema = this._getSchema(bdmXml);
    this._removeGraphqlRoute();
    this.schema = newSchema;
    this.addGraphqlRoute();
  }
}

module.exports = BdrServer;
