const GraphqlSchemaGenerator = require('../src/schema/GraphqlSchemaGenerator');
const fs = require('fs');
const xmlParser = require('xml-js');
const { buildSchema } = require('graphql');

describe('GraphqlSchemaGenerator', () => {
  test('should return an error if no bdm given at init', () => {
    expect(() => {
      new GraphqlSchemaGenerator();
    }).toThrow();
  });

  test('Generate valid graphQL schema with various BDMs', () => {
    buildSchema(_getSchema('test/resources/bdm_CustomerOrder.xml'));
    buildSchema(_getSchema('test/resources/bdm_test_no_attributes.xml'));
  });

  test('Generate expected types in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type Customer');
    expect(schema).toContain('type CustomerQuery');
    expect(schema).toContain('type OrderInfo');
    expect(schema).toContain('type OrderInfoQuery');
  });

  test('Generate expected queries from attributes in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type CustomerQuery');
    expect(schema).toContain('findByName(name: String!): Customer');
    expect(schema).toContain('findByAddress(address: String!): Customer');
    expect(schema).toContain('findByPhoneNumber(phoneNumber: String!): Customer');
    expect(schema).toContain('find: Customer');
  });

  test('Generate expected queries from constraints in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type CustomerQuery');
    expect(schema).toContain(
      'findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer'
    );
    expect(schema).toContain(
      'findByAddressAndPhoneNumberAndName(address: String!, phoneNumber: String!, name: String!): Customer'
    );
  });

  function _getSchema(xmlFilePath) {
    let bdmXml = fs.readFileSync(xmlFilePath, 'utf8');
    let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
    let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
    schemaGenerator.generate();
    return schemaGenerator.getSchema();
  }
});
