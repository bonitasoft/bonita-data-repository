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
const fs = require('fs');
const { buildSchema } = require('graphql');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const cors = require('cors');
const xmlParser = require('xml-js');
import { GraphqlSchemaGenerator } from '../schema/GraphqlSchemaGenerator';
import { StudioHealthCheck } from '../StudioHealthCheck';
import { Application } from 'express';
import { BdrLogger } from '../logger/BdrLogger';

export class BdrServer {
  private readonly config: any;
  private readonly port: number;
  private readonly host: string;
  private static readonly graphqlPath = '/bdr';
  private readonly logger: any;
  private static readonly emptySchema = 'type Query { content: String }';
  private schema: string;
  private readonly resolvers: object;
  private readonly expressApp: Application;

  constructor(config: Configuration) {
    this.logger = winston.loggers.get('bo-logger');

    // Port default value
    this.config = config;
    this.port = config.port || 4000;
    this.host = config.host || '127.0.0.1';
    this.schema = this.buildInitialGraphqlSchema();
    this.resolvers = {
      Query: {}
    };
    this.expressApp = express();
    // Tell Express to parse application/json
    // Note: the limit has been increased from 100k (default) to 1mb, so that we can handle 3x the max known BDM.
    this.expressApp.use(
      express.json({
        limit: '1mb'
      })
    );
    // Enable cors for all
    this.expressApp.use(cors());
  }

  public start() {
    this.expressApp.listen(this.port, this.host);
    this.addBdrServerRootRoute();
  }

  public getPort() {
    return this.port;
  }

  public getHost() {
    return this.host;
  }

  public static getGraphqlPath() {
    return this.graphqlPath;
  }

  public getExpressApp(): Application {
    return this.expressApp;
  }

  public getSchema() {
    return this.schema;
  }

  public startHealthCheckIfNeeded() {
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

  public addGraphqlRoute() {
    this.expressApp.use(
      BdrServer.graphqlPath,
      graphqlHTTP({
        schema: this.schema,
        rootValue: this.resolvers,
        graphiql: true
      })
    );
  }

  public addBdmPostRoute() {
    let myself = this;
    this.expressApp.post('/bdm', function(req: any, res: any) {
      myself.logger.debug('BDM pushed.');
      myself.handleNewBdmXml(req.body.bdmXml);
      res.send();
    });
  }

  public addBdmDeleteRoute() {
    let myself = this;
    this.expressApp.delete('/bdm', function(req: any, res: any) {
      myself.logger.debug('BDM deleted.');
      myself.deleteBdm();
      res.send();
    });
  }

  public addBdrServerRootRoute() {
    this.expressApp.get('/', function(req: any, res: any) {
      res.send('<h3>Bonita Data Repository server is up and running</h3>');
    });
  }

  // public for tests
  public handleNewBdmXml(bdmXml: string) {
    let newSchema = BdrServer.getSchemaFromBdmXml(bdmXml);
    this.updateSchema(newSchema);
  }

  // public for tests
  public deleteBdm() {
    this.updateSchema(buildSchema(BdrServer.emptySchema));
  }

  //
  // Private methods
  //

  private buildInitialGraphqlSchema(): string {
    let schema = buildSchema(BdrServer.emptySchema);
    if (this.config.bdmFile) {
      let bdmXml = fs.readFileSync(this.config.bdmFile, 'utf8');
      schema = BdrServer.getSchemaFromBdmXml(bdmXml);
      this.logger.debug(`BDM added:  ${this.config.bdmFile}`);
    }
    return schema;
  }

  private static getSchemaFromBdmXml(bdmXml: string): any {
    let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
    let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
    schemaGenerator.generate();
    return buildSchema(schemaGenerator.getSchema());
  }

  private removeGraphqlRoute() {
    let routes = this.expressApp._router.stack;
    routes.forEach(removeMiddlewares);
    function removeMiddlewares(route: any, i: any, routes: any) {
      if (route.handle.name === 'graphqlMiddleware') {
        routes.splice(i, 1);
      }
      if (route.route) {
        route.route.stack.forEach(removeMiddlewares);
      }
    }
  }

  private updateSchema(newSchema: string) {
    this.removeGraphqlRoute();
    this.schema = newSchema;
    this.addGraphqlRoute();
  }
}