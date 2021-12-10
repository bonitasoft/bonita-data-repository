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

import { BdmModelGenerator } from '../src/schema/BdmModelGenerator';

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
      try {
        buildSchema(_getSchema('test/resources/' + xmlFile));
      } catch (e) {
        if (!(xmlFile === 'bdm_simple_non_ascii.xml')) {
          throw e;
        }
      }
    }
  });

  test('Check expected types in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_Customer');
    expect(schema).toContain('type com_company_model_CustomerQuery');
    expect(schema).toContain('type com_company_model_OrderInfo');
    expect(schema).toContain('type com_company_model_OrderInfoQuery');
  });

  test('Check expected attributes in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain(
      '"""\n' +
        'Description of a Customer\n' +
        '"""\n' +
        'type com_company_model_Customer {\n' +
        '\n\t""" Full name of the customer """\n' +
        '\tname: String\n' +
        '\n\t""" Detailed address of the customer """\n' +
        '\taddress: [String]\n' +
        '\n\t""" Mobile phone number of the customer """\n' +
        '\tphoneNumber: String\n' +
        '\n\t""" Free string """\n' +
        '\tcomment: [String]\n' +
        '\n\t""" Products ordered by the customer """\n' +
        '\torders: [com_company_model_OrderInfo]\n' +
        '}'
    );
  });

  test('Check expected queries from attributes in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerQuery');
    expect(schema).toContain('findByName(name: String!): com_company_model_Customer');
    expect(schema).toContain('findByPhoneNumber(phoneNumber: String!): com_company_model_Customer');
    expect(schema).not.toContain('findByComment');
    expect(schema).toContain('find: com_company_model_Customer');

    expect(schema).toContain('type com_company_model_OrderInfoQuery');
    expect(schema).toContain('findByItemName(itemName: String!): com_company_model_OrderInfo');
    expect(schema).toContain('findByNumber(number: Int!): com_company_model_OrderInfo');
    expect(schema).toContain('find: com_company_model_OrderInfo');
  });

  test('Check expected queries from constraints in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerQuery');
    expect(schema).toContain(
      'findByNameAndPhoneNumber(name: String!, phoneNumber: String!): com_company_model_Customer'
    );
    expect(schema).toContain(
      'findByAddressAndPhoneNumberAndName(address: [String]!, phoneNumber: String!, name: String!): com_company_model_Customer'
    );
  });

  test('Check expected custom queries in graphQL schema', () => {
    let schema = _getSchema('test/resources/bdm_CustomerOrder.xml');
    expect(schema).toContain('type com_company_model_CustomerQuery');
    expect(schema).toContain(
      'query1(name: String!, address: [String]!, phoneNumber: String!): [com_company_model_Customer]'
    );
    expect(schema).toContain('query2(name: String!, address: String!): com_company_model_Customer');
    expect(schema).toContain('query3: Int');
    expect(schema).toContain('query4: Float');
    expect(schema).toContain('query5: Float');
    expect(schema).toContain('query6: Int');
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
    let bdmModelGenerator = new BdmModelGenerator(bdmJson);
    bdmModelGenerator.generate();
    let schemaGenerator = new GraphqlSchemaGenerator(bdmModelGenerator.getBdmModel());
    schemaGenerator.generate();
    return schemaGenerator.getSchema();
  }
});
