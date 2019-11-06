const fs = require('fs');
const xmlParser = require('xml-js');
const { buildSchema } = require('graphql');

import { GraphqlSchemaGenerator } from '../src/schema/GraphqlSchemaGenerator';
import { BdrLogger } from '../src/logger/BdrLogger';
import { Configuration } from '../src/server/Configuration';

BdrLogger.init(new Configuration());

describe('GraphqlSchemaGenerator', () => {
  test('Check valid graphQL schema with various BDMs', () => {
    let xmlFiles: any = fs.readdirSync('test/resources');
    for (let xmlFile of xmlFiles) {
      buildSchema(_getSchema('test/resources/' + xmlFile));
    }
  });

  test('Check expected types in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_Customer');
    expect(schema).toContain('type com_company_model_CustomerQuery');
    expect(schema).toContain('type com_company_model_OrderInfo');
    expect(schema).toContain('type com_company_model_OrderInfoQuery');
  });

  test('Check expected queries from attributes in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerAttributeQuery');
    expect(schema).toContain('findByName(name: String!): com_company_model_Customer');
    expect(schema).toContain('findByAddress(address: String!): com_company_model_Customer');
    expect(schema).toContain('findByPhoneNumber(phoneNumber: String!): com_company_model_Customer');
    expect(schema).not.toContain('findByComment');
    expect(schema).toContain('find: com_company_model_Customer');

    expect(schema).toContain('type com_company_model_OrderInfoAttributeQuery');
    expect(schema).toContain('findByItemName(itemName: String!): com_company_model_OrderInfo');
    expect(schema).toContain('findByNumber(number: Int!): com_company_model_OrderInfo');
    expect(schema).toContain('find: com_company_model_OrderInfo');
  });

  test('Check expected queries from constraints in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerConstraintQuery');
    expect(schema).toContain(
      'findByNameAndPhoneNumber(name: String!, phoneNumber: String!): com_company_model_Customer'
    );
    expect(schema).toContain(
      'findByAddressAndPhoneNumberAndName(address: String!, phoneNumber: String!, name: String!): com_company_model_Customer'
    );
  });

  test('Check expected custom queries in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerCustomQuery');
    expect(schema).toContain(
      'query1(name: String!, address: String!, phoneNumber: String!): [com_company_model_Customer]'
    );
    expect(schema).toContain('query2(name: String!, address: String!): com_company_model_Customer');
    expect(schema).toContain('query3: Int');
    expect(schema).toContain('query4: Float');
    expect(schema).toContain('query5: Float');
    expect(schema).toContain('query6: Int');
  });

  test('Check expected bdm object queries in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerQuery');
    expect(schema).toContain('attributeQuery');
    expect(schema).toContain('constraintQuery');
    expect(schema).toContain('customQuery');

    expect(schema).toContain('type com_company_model_OrderInfoQuery');
  });

  test('Check expected root query in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type Query');
    expect(schema).toContain('com_company_model_CustomerQuery: com_company_model_CustomerQuery');
    expect(schema).toContain('com_company_model_OrderInfoQuery: com_company_model_OrderInfoQuery');
  });

  function _getSchema(xmlFilePath: string) {
    let bdmXml = fs.readFileSync(xmlFilePath, 'utf8');
    let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
    let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
    schemaGenerator.generate();
    return schemaGenerator.getSchema();
  }
});
