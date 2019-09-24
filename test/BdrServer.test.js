const BdrServer = require('../src/server/BdrServer');
const fs = require('fs');

describe('BdrServer', () => {
  test('should return an error if no config given at init', () => {
    expect(() => {
      new BdrServer();
    }).toThrow();
  });

  test('should have graphQL route and BDM Post route initialized correctly', () => {
    let server = new BdrServer([]);
    server.addGraphqlRoute();
    server.addBdmPostRoute();
    let routes = server.getExpressApp()._router.stack;
    let graphqlRouteFound = false;
    let bdmPostRouteFound = false;
    routes.forEach(route => {
      if (route.name === 'graphqlMiddleware') {
        graphqlRouteFound = true;
      }
      if (route.route && route.route.path === '/bdm' && route.route.methods.post) {
        bdmPostRouteFound = true;
      }
    });
    expect(graphqlRouteFound).toBeTruthy();
    expect(bdmPostRouteFound).toBeTruthy();
  });

  test('should handle new BDM xml', () => {
    let server = new BdrServer([]);
    let graphqlTypes = server.getSchema()._typeMap;
    expect(graphqlTypes.Customer).toBeUndefined();
    expect(graphqlTypes.CustomerQuery).toBeUndefined();
    let bdmXml = _getBdmXml('test/resources/bdm_CustomerOrder.xml');
    server._handleNewBdmXml(bdmXml);
    graphqlTypes = server.getSchema()._typeMap;
    expect(graphqlTypes.Customer).toBeDefined();
    expect(graphqlTypes.CustomerQuery).toBeDefined();
  });

  function _getBdmXml(xmlFilePath) {
    return fs.readFileSync(xmlFilePath, 'utf8');
  }
});
