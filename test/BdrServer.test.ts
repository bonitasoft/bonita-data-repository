import { Configuration } from '../src/server/Configuration';
import { BdrLogger } from '../src/logger/BdrLogger';
import { BdrServer } from '../src/server/BdrServer';

const fs = require('fs');

BdrLogger.init(new Configuration());

describe('BdrServer', () => {
  test('should have graphQL route and BDM Post route initialized correctly', () => {
    let server = new BdrServer(new Configuration());
    server.addGraphqlRoute();
    server.addBdmPostRoute();
    server.addBdmGetRoute();
    let routes = server.getExpressApp()._router.stack;
    let graphqlRouteFound = false;
    let bdmPostRouteFound = false;
    let bdmGetRouteFound = false;
    routes.forEach((route: any) => {
      if (route.name === 'graphqlMiddleware') {
        graphqlRouteFound = true;
      }
      if (route.route && route.route.path === '/bdm') {
        if (route.route.methods.post) {
          bdmPostRouteFound = true;
        }
        if (route.route.methods.get) {
          bdmGetRouteFound = true;
        }
      }
    });
    expect(graphqlRouteFound).toBeTruthy();
    expect(bdmPostRouteFound).toBeTruthy();
    expect(bdmGetRouteFound).toBeTruthy();
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

  test('should get BDM', () => {
    let server = new BdrServer(new Configuration());
    let bdmXml = _getBdmXml('test/resources/bdm_CustomerOrder.xml');
    server.handleNewBdmXml(bdmXml);
    let bdmJson = JSON.parse(server.getBdmJson());
    let objects = bdmJson.businessObjectModel.businessObjects.businessObject;
    expect(objects.length).toBe(2);
    expect(objects[0]._attributes.qualifiedName).toBe('com.company.model.Customer');
    expect(objects[1]._attributes.qualifiedName).toBe('com.company.model.OrderInfo');
  });

  function _getBdmXml(xmlFilePath: string) {
    return fs.readFileSync(xmlFilePath, 'utf8');
  }
});
