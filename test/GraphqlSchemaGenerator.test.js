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

  test('Check valid graphQL schema with various BDMs', () => {
    buildSchema(_getSchema('test/resources/bdm_CustomerOrder.xml'));
    buildSchema(_getSchema('test/resources/bdm_test_no_attributes.xml'));
  });

  test('Check expected types in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type Customer');
    expect(schema).toContain('type CustomerQuery');
    expect(schema).toContain('type OrderInfo');
    expect(schema).toContain('type OrderInfoQuery');
  });

  test('Check expected queries from attributes in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type CustomerAttributeQuery');
    expect(schema).toContain('findByName(name: String!): Customer');
    expect(schema).toContain('findByAddress(address: String!): Customer');
    expect(schema).toContain('findByPhoneNumber(phoneNumber: String!): Customer');
    expect(schema).toContain('find: Customer');

    expect(schema).toContain('type OrderInfoAttributeQuery');
    expect(schema).toContain('findByItemName(itemName: String!): OrderInfo');
    expect(schema).toContain('findByNumber(number: Int!): OrderInfo');
    expect(schema).toContain('find: OrderInfo');
  });

  test('Check expected queries from constraints in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type CustomerConstraintQuery');
    expect(schema).toContain(
      'findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer'
    );
    expect(schema).toContain(
      'findByAddressAndPhoneNumberAndName(address: String!, phoneNumber: String!, name: String!): Customer'
    );
  });

  test('Check expected custom queries in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type CustomerCustomQuery');
    expect(schema).toContain(
      'query1(name: String!, address: String!, phoneNumber: String!): [Customer]'
    );
    expect(schema).toContain('query2(name: String!, address: String!): Customer');
    expect(schema).toContain('query3: Int');
    expect(schema).toContain('query4: Float');
    expect(schema).toContain('query5: Float');
    expect(schema).toContain('query6: Int');
  });

  test('Check expected bdm object queries in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type CustomerQuery');
    expect(schema).toContain('customerAttributeQuery');
    expect(schema).toContain('customerConstraintQuery');
    expect(schema).toContain('customerCustomQuery');

    expect(schema).toContain('type OrderInfoQuery');
    expect(schema).toContain('orderInfoAttributeQuery');
  });

  test('Check expected root query in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type Query');
    expect(schema).toContain('customerQuery: CustomerQuery');
    expect(schema).toContain('orderInfoQuery: OrderInfoQuery');
  });

  function _getSchema(xmlFilePath) {
    let bdmXml = fs.readFileSync(xmlFilePath, 'utf8');
    let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
    let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
    schemaGenerator.generate();
    return schemaGenerator.getSchema();
  }
});
