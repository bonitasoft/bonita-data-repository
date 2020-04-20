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

import { BdmModel } from './BdmModel';
import { Attribute } from './Attribute';
import { RelationAttribute } from './RelationAttribute';
import { Query } from './Query';
import { CustomQuery } from './CustomQuery';
import { Filter } from './Filter';

export class GraphqlSchemaGenerator {
  private readonly bdmModel: BdmModel;
  private schema: string[];

  constructor(bdmModel: BdmModel) {
    this.bdmModel = bdmModel;
    this.schema = [];
  }

  public generate() {
    // Custom types
    this.schema.push('scalar Date\n');
    this.schema.push('scalar DateTime\n\n');

    let bdmBusObjects = this.bdmModel.businessObjects;
    for (let bdmBusObject of bdmBusObjects) {
      let bdmObjectName = GraphqlSchemaGenerator.getQualifiedName(bdmBusObject.qualifiedName);
      this.schema.push('type ', bdmObjectName, ' {\n');
      let bdmAtts = bdmBusObject.attributes;
      if (bdmAtts) {
        this.generateAttributes(bdmAtts);
      }
      this.schema.push('}\n\n');
    }

    //
    // Query generation
    //

    // Generate queries
    let bdmObjectsWithQuery: string[] = [];
    for (let bdmBusObject of bdmBusObjects) {
      let bdmObjectName = GraphqlSchemaGenerator.getQualifiedName(bdmBusObject.qualifiedName);
      // We may have no attribute queries if no attribute (only relations)
      // Generate attribute queries
      let attributeQueries: string[] = [];
      if (bdmBusObject.attributeQueries.length > 0) {
        attributeQueries = GraphqlSchemaGenerator.getAttributeQueries(
          bdmObjectName,
          bdmBusObject.attributeQueries
        );
      }
      // Generate default queries from unique constraints
      let constraintQueries: string[] = [];
      if (bdmBusObject.constraintQueries.length > 0) {
        constraintQueries = this.getQueriesFromConstraints(
          bdmObjectName,
          bdmBusObject.constraintQueries
        );
      }
      // Generate custom queries
      let customQueries: string[] = [];
      if (bdmBusObject.customQueries.length > 0) {
        customQueries = this.getCustomQueries(bdmObjectName, bdmBusObject.customQueries);
      }

      // // Concatenate queries, without duplicates (use Set)
      let queries = [...new Set(attributeQueries.concat(constraintQueries, customQueries))];
      if (queries.length > 0) {
        this.generateBdmObjectQuery(bdmObjectName, queries);
        bdmObjectsWithQuery.push(bdmObjectName);
      }
    }

    // This is the (mandatory) Query root.
    this.generateRootQuery(bdmObjectsWithQuery);
  }

  public getResolvers() {
    return GraphqlSchemaGenerator.generateInfoResolver();
  }

  public getSchema() {
    // console.log(this.schema.join(''));
    return this.schema.join('');
  }

  //
  // Private methods
  //

  private generateAttributes(bdmAttsArray: Attribute[]) {
    for (let bdmAtt of bdmAttsArray) {
      let mandatoryStr = bdmAtt.nullable ? '' : '!';
      let type = '';
      if (bdmAtt instanceof RelationAttribute) {
        type = GraphqlSchemaGenerator.getQualifiedName(bdmAtt.reference);
      } else {
        type = GraphqlSchemaGenerator.xmlToGraphqlType(bdmAtt.type);
      }
      if (bdmAtt.collection) {
        type = '[' + type + ']';
      }
      let name = bdmAtt.name;
      this.schema.push('\t', name, ': ', type + mandatoryStr, '\n');
    }
  }

  private static getAttributeQueries(bdmObjectName: string, attQueries: Query[]): string[] {
    //   findByName(name: String!): Customer
    //   ...
    //   find: Customer
    let queries: string[] = [];
    for (let attQuery of attQueries) {
      if (attQuery.filters.length === 1) {
        // If any, always a single Filter for attribute queries
        let filter = attQuery.filters[0];
        let name = filter.name;
        let type = GraphqlSchemaGenerator.xmlToGraphqlType(filter.type);
        queries.push(attQuery.name + '(' + name + ': ' + type + '!): ' + bdmObjectName);
      } else {
        // find() query
        queries.push(attQuery.name + ': ' + bdmObjectName);
      }
    }

    return queries;
  }

  private getQueriesFromConstraints(bdmObjectName: string, constraintQueries: Query[]): string[] {
    // e.g. :
    //   findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer
    //   ...
    let queries: string[] = [];
    for (let bdmConstraint of constraintQueries) {
      let findParametersArr: string[] = [];
      bdmConstraint.filters.forEach(filter => {
        let type = GraphqlSchemaGenerator.xmlToGraphqlType(filter.type);
        if (filter.collection) {
          type = '[' + type + ']';
        }
        findParametersArr.push(filter.name + ': ' + type + '!');
      });
      queries.push(bdmConstraint.name + '(' + findParametersArr.join(', ') + '): ' + bdmObjectName);
    }
    return queries;
  }

  private getCustomQueries(bdmObjectName: string, customQueries: CustomQuery[]): string[] {
    // e.g. :
    //   query1(name: String!): [Customer]
    //   ...
    let queries: string[] = [];
    for (let customQuery of customQueries) {
      let queryName = customQuery.name;
      let bdmReturnType = customQuery.returnType;
      let returnType;
      if (bdmReturnType === 'java.util.List') {
        returnType = '[' + bdmObjectName + ']';
      } else if (GraphqlSchemaGenerator.getQualifiedName(bdmReturnType) === bdmObjectName) {
        returnType = bdmObjectName;
      } else {
        returnType = GraphqlSchemaGenerator.xmlToGraphqlType(
          GraphqlSchemaGenerator.getLastItem(bdmReturnType)
        );
      }
      let filters = customQuery.filters;
      let paramsStr = '';
      if (filters.length > 0) {
        paramsStr = this.generateQueryParamsString(filters);
      }
      queries.push(queryName + paramsStr + ': ' + returnType);
    }
    return queries;
  }

  private generateBdmObjectQuery(bdmObjectName: string, queries: string[]) {
    // e.g. :
    // type CustomerQuery {
    //   findByName(name: String!): Customer
    //   findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer
    //    ...
    // }
    this.schema.push('type ', bdmObjectName, 'Query {\n');
    for (let query of queries) {
      this.schema.push('\t' + query + '\n');
    }
    this.schema.push('}\n\n');
  }

  private generateRootQuery(bdmObjectsWithQuery: string[]) {
    // e.g. :
    // type Query {
    //  customerQuery: CustomerQuery
    //  ...
    // }
    this.schema.push('type ', 'Query {\n');
    let myself = this;
    bdmObjectsWithQuery.forEach(bdmObjectName => {
      myself.generateRootQueryItem(bdmObjectName);
    });
    this.schema.push('}\n\n');
  }

  private generateRootQueryItem(bdmObjectName: string) {
    let queryName = bdmObjectName + 'Query';
    this.schema.push(
      '\t',
      GraphqlSchemaGenerator.lowercaseFirstLetter(queryName),
      ': ',
      queryName,
      '\n'
    );
  }

  //
  // Private static methods
  //

  private generateQueryParamsString(filters: Array<Filter>): string {
    // e.g. :
    // (name: String!)

    // Map of paramName, paramType
    let paramsMap = new Map();
    for (let filter of filters) {
      let paramName = filter.name;
      let paramType = GraphqlSchemaGenerator.xmlToGraphqlType(filter.type);
      if (filter.collection) {
        paramType = '[' + paramType + ']';
      }
      paramsMap.set(paramName, GraphqlSchemaGenerator.xmlToGraphqlType(paramType));
    }
    let paramsStringArray: string[] = [];
    paramsMap.forEach((value, key) => {
      paramsStringArray.push(key + ': ' + value + '!');
    });
    return '(' + paramsStringArray.join(', ') + ')';
  }

  private static generateInfoResolver(): Object {
    return { Query: { info: () => `This is the API of BDM repository` } };
  }

  private static xmlToGraphqlType(xmlType: string) {
    switch (xmlType.toUpperCase()) {
      case 'BOOLEAN':
        return 'Boolean';
      case 'INTEGER':
      case 'LONG':
        return 'Int';
      case 'DOUBLE':
      case 'FLOAT':
        return 'Float';
      case 'STRING':
      case 'TEXT':
        return 'String';
      case 'LOCALDATE':
      case 'DATE':
        return 'Date';
      case 'LOCALDATETIME':
      case 'OFFSETDATETIME':
        return 'DateTime';
      default:
        return xmlType;
    }
  }

  private static asArray(element: any): any[] {
    // Put element in an array (if needed)
    let arr;
    if (!Array.isArray(element)) {
      arr = [];
      arr.push(element);
    } else {
      arr = element;
    }
    return arr;
  }

  private static getLastItem(path: string): string {
    return path.substring(path.lastIndexOf('.') + 1);
  }

  private static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private static lowercaseFirstLetter(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private static getQualifiedName(dotQualifiedName: string): string {
    // Replace '.' by '_', since graphQL does not support '.' in names
    return dotQualifiedName.replace(/\./g, '_');
  }
}
