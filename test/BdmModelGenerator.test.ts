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
import { GraphqlSchemaGenerator } from '../src/schema/GraphqlSchemaGenerator';
import { BdrLogger } from '../src/logger/BdrLogger';
import { Configuration } from '../src/server/Configuration';
import { BdmModel } from '../src/schema/BdmModel';
import { RelationAttribute } from '../src/schema/RelationAttribute';

const fs = require('fs');
const xmlParser = require('xml-js');

BdrLogger.init(new Configuration());

describe('GraphqlSchemaGenerator', () => {
  test('Check model generation with various BDMs', () => {
    let xmlFiles: any = fs.readdirSync('test/resources');
    for (let xmlFile of xmlFiles) {
      let model: BdmModel = _getModel('test/resources/' + xmlFile);
      expect(model.businessObjects).toBeDefined();
    }
  });

  test('BDM model should contain expected objects', () => {
    let model: BdmModel = _getCustomerOrderModel();

    let objects = model.businessObjects;
    expect(objects.length).toBe(2);
    expect(objects[0].qualifiedName).toBe('com.company.model.Customer');
    expect(objects[1].qualifiedName).toBe('com.company.model.OrderInfo');
    let customer = objects[0];
  });

  test('BDM model should contain expected Attributes', () => {
    let model: BdmModel = _getCustomerOrderModel();
    let customer = model.businessObjects[0];
    let customerAtts = customer.attributes;
    expect(customerAtts.length).toBe(5);
    expect(customerAtts[0].name).toBe('name');
    expect(customerAtts[1].name).toBe('address');
    expect(customerAtts[2].name).toBe('phoneNumber');
    expect(customerAtts[3].name).toBe('comment');
    expect(customerAtts[4].name).toBe('orders');
    let name = customerAtts[0];
    expect(name.name).toBeDefined();
    expect(name.type).toBeDefined();
    expect(name.nullable).toBeDefined();
    expect(name.collection).toBeDefined();
    expect(name.description).toBeDefined();
    let orders = <RelationAttribute>customerAtts[4];
    expect(orders.name).toBe('orders');
    expect(orders.reference).toBe('com.company.model.OrderInfo');
    expect(orders.type).toBe('AGGREGATION');
    expect(orders.fetchType).toBe('LAZY');
  });

  test('BDM model should contain expected Attribute Queries', () => {
    let model: BdmModel = _getCustomerOrderModel();
    let customer = model.businessObjects[0];
    let attributeQueries = customer.attributeQueries;
    expect(attributeQueries.length).toBe(5);
    let findByNameQuery = attributeQueries[0];
    expect(findByNameQuery.name).toBe('findByName');
    expect(findByNameQuery.filters.length).toBe(1);
    expect(findByNameQuery.filters[0].name).toBe('name');
    expect(findByNameQuery.filters[0].type).toBe('STRING');
    expect(attributeQueries[1].name).toBe('findByAddress');
    expect(attributeQueries[2].name).toBe('findByPhoneNumber');
    expect(attributeQueries[3].name).toBe('find');
    expect(attributeQueries[4].name).toBe('findByPersistenceId');
  });

  test('BDM model should contain expected Constraint Queries', () => {
    let model: BdmModel = _getCustomerOrderModel();
    let customer = model.businessObjects[0];
    let constraintQueries = customer.constraintQueries;
    expect(constraintQueries.length).toBe(2);
    let query1 = constraintQueries[0];
    expect(query1.name).toBe('findByNameAndPhoneNumber');
    expect(query1.filters.length).toBe(2);
    expect(query1.filters[0].name).toBe('name');
    expect(query1.filters[0].type).toBe('STRING');
    expect(constraintQueries[1].name).toBe('findByAddressAndPhoneNumberAndName');
  });

  test('BDM model should contain expected Custom Queries', () => {
    let model: BdmModel = _getCustomerOrderModel();
    let customer = model.businessObjects[0];
    let customQueries = customer.customQueries;
    expect(customQueries.length).toBe(6);
    let query1 = customQueries[0];
    expect(query1.name).toBe('query1');
    expect(query1.filters.length).toBe(3);
    expect(query1.filters[0].name).toBe('name');
    expect(query1.filters[0].type).toBe('STRING');
    expect(query1.filters[1].name).toBe('address');
    expect(query1.filters[1].type).toBe('STRING');
    expect(query1.filters[2].name).toBe('phoneNumber');
    expect(query1.filters[2].type).toBe('STRING');
    let query2 = customQueries[1];
    expect(query2.name).toBe('query2');
    expect(query2.filters.length).toBe(2);
    let query3 = customQueries[2];
    expect(query3.name).toBe('query3');
    expect(query3.filters.length).toBe(0);
    expect(customQueries[3].name).toBe('query4');
    expect(customQueries[4].name).toBe('query5');
    expect(customQueries[5].name).toBe('query6');
  });

  function _getModel(xmlFilePath: string) {
    let bdmXml = fs.readFileSync(xmlFilePath, 'utf8');
    let bdmJson = xmlParser.xml2json(bdmXml, { compact: true, spaces: 4 });
    let modelGenerator = new BdmModelGenerator(bdmJson);
    modelGenerator.generate();
    return modelGenerator.getBdmModel();
  }

  function _getCustomerOrderModel() {
    return _getModel('test/resources/bdm_CustomerOrder.xml');
  }
});
