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

import { Configuration } from '../src/server/Configuration';
import { BdrLogger } from '../src/logger/BdrLogger';
import { BdrServer } from '../src/server/BdrServer';

const fs = require('fs');

BdrLogger.init(new Configuration());

describe('BdrServer', () => {
  test('should have graphQL, BDM json and BDM Post routes initialized correctly', () => {
    let server = new BdrServer(new Configuration());
    server.addGraphqlRoute();
    server.addBdmPostRoute();
    server.addBdmJsonRoute();
    let routes = server.getExpressApp()._router.stack;
    let graphqlRouteFound = false;
    let bdmPostRouteFound = false;
    let bdmJsonGetRouteFound = false;
    routes.forEach((route: any) => {
      if (route.name === 'graphqlMiddleware') {
        graphqlRouteFound = true;
      }
      if (route.route && route.route.methods.post && route.route.path === '/bdm') {
        bdmPostRouteFound = true;
      }
      if (
        route.route &&
        route.route.methods.get &&
        route.route.path === BdrServer.getBdmJsonPath()
      ) {
        bdmJsonGetRouteFound = true;
      }
    });

    expect(graphqlRouteFound).toBeTruthy();
    expect(bdmPostRouteFound).toBeTruthy();
    expect(bdmJsonGetRouteFound).toBeTruthy();
  });

  test('should handle new BDM xml', () => {
    let server = new BdrServer(new Configuration());
    let graphqlTypes = (<any>server.getSchema())._typeMap;
    expect(graphqlTypes.com_company_model_Customer).toBeUndefined();
    expect(graphqlTypes.com_company_model_CustomerQuery).toBeUndefined();
    let bdmXml = _getBdmXml('test/resources/bdm_CustomerOrder.xml');
    server.handleNewBdmXml(bdmXml);
    graphqlTypes = (<any>server.getSchema())._typeMap;
    expect(graphqlTypes.com_company_model_Customer).toBeDefined();
    expect(graphqlTypes.com_company_model_CustomerQuery).toBeDefined();
  });

  test('should remove BDM', () => {
    let server = new BdrServer(new Configuration());
    let bdmXml = _getBdmXml('test/resources/bdm_CustomerOrder.xml');
    server.handleNewBdmXml(bdmXml);
    let graphqlTypes = (<any>server.getSchema())._typeMap;
    expect(graphqlTypes.com_company_model_Customer).toBeDefined();
    expect(graphqlTypes.com_company_model_CustomerQuery).toBeDefined();
    server.deleteBdm();
    graphqlTypes = (<any>server.getSchema())._typeMap;
    expect(graphqlTypes.com_company_model_Customer).toBeUndefined();
    expect(graphqlTypes.com_company_model_CustomerQuery).toBeUndefined();
  });

  function _getBdmXml(xmlFilePath: string) {
    return fs.readFileSync(xmlFilePath, 'utf8');
  }
});
