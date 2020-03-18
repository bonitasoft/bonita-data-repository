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

  test('should get BDM with correct json model', () => {
    let server = new BdrServer(new Configuration());
    let bdmXml = _getBdmXml('test/resources/bdm_CustomerOrder.xml');
    server.handleNewBdmXml(bdmXml);
    let bdmJson = JSON.parse(server.getBdmJson());

    // Objects
    let objects = bdmJson._businessObjects;
    expect(objects.length).toBe(2);
    expect(objects[0].qualifiedName).toBe('com.company.model.Customer');
    expect(objects[1].qualifiedName).toBe('com.company.model.OrderInfo');
    let customer = objects[0];

    // Attributes
    let customerAtts = customer.attributes;
    expect(customerAtts.length).toBe(5);
    let orders = customerAtts[4];
    expect(orders.name).toBe('orders');
    expect(orders.reference).toBe('com.company.model.OrderInfo');
    expect(orders.type).toBe('AGGREGATION');
    expect(orders.fetchType).toBe('LAZY');

    // Queries
    let attributeQueries = customer.attributeQueries;
    expect(attributeQueries.length).toBe(5);
    let findByNameQuery = attributeQueries[0];
    expect(findByNameQuery.name).toBe('findByName');
    expect(findByNameQuery.filters.length).toBe(1);
    expect(findByNameQuery.filters[0].name).toBe('name');
    expect(findByNameQuery.filters[0].type).toBe('STRING');
    let constraintQueries = customer.constraintQueries;
    expect(constraintQueries.length).toBe(2);
    let customQueries = customer.customQueries;
    expect(customQueries.length).toBe(6);
  });

  function _getBdmXml(xmlFilePath: string) {
    return fs.readFileSync(xmlFilePath, 'utf8');
  }
});
