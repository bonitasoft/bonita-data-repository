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

export class GraphqlSchemaGenerator {
  private readonly bdmJson: string;
  private schema: string[];

  constructor(bdmJson: string) {
    this.bdmJson = bdmJson;
    this.schema = [];
  }

  public generate() {
    let bdm: any = JSON.parse(this.bdmJson);

    // Generate types
    let attributesTypeMap = new Map<string, string>();
    if (
      !bdm ||
      !bdm.businessObjectModel ||
      !bdm.businessObjectModel.businessObjects ||
      !bdm.businessObjectModel.businessObjects.businessObject
    ) {
      return;
    }

    // Custom types
    this.schema.push('scalar Date\n');
    this.schema.push('scalar DateTime\n\n');

    let bdmBusObjects: any[] = GraphqlSchemaGenerator.asArray(
      bdm.businessObjectModel.businessObjects.businessObject
    );
    for (let bdmBusObject of bdmBusObjects) {
      let bdmObjectName = GraphqlSchemaGenerator.getQualifiedName(
        bdmBusObject._attributes.qualifiedName
      );
      this.schema.push('type ', bdmObjectName, ' {\n');
      let bdmAtts = bdmBusObject.fields.field;
      if (bdmAtts) {
        this.generateAttributes(GraphqlSchemaGenerator.asArray(bdmAtts), attributesTypeMap);
      }
      let bdmAttRels = bdmBusObject.fields.relationField;
      if (bdmAttRels) {
        this.generateRelationAttributes(GraphqlSchemaGenerator.asArray(bdmAttRels));
      }
      this.schema.push('}\n\n');
    }

    //
    // Query generation
    //

    // Generate queries
    let bdmObjectsWithQuery: string[] = [];
    for (let bdmBusObject of bdmBusObjects) {
      let bdmObjectName = GraphqlSchemaGenerator.getQualifiedName(
        bdmBusObject._attributes.qualifiedName
      );
      // We may have no attribute queries if no attribute (only relations)
      // Generate attribute queriess
      let bdmAtts: string = bdmBusObject.fields.field;
      let attributeQueries: string[] = [];
      if (bdmAtts) {
        attributeQueries = GraphqlSchemaGenerator.getAttributeQueries(
          bdmObjectName,
          GraphqlSchemaGenerator.asArray(bdmAtts)
        );
      }
      // Generate default queries from unique constraints
      let constraints = bdmBusObject.uniqueConstraints.uniqueConstraint;
      let constraintQueries: string[] = [];
      if (constraints) {
        constraintQueries = this.getQueriesFromConstraints(
          bdmObjectName,
          GraphqlSchemaGenerator.asArray(constraints),
          attributesTypeMap
        );
      }
      // Generate custom queries
      let bdmCustomQueries = bdmBusObject.queries.query;
      let customQueries: string[] = [];
      if (bdmCustomQueries) {
        customQueries = this.getCustomQueries(
          bdmObjectName,
          GraphqlSchemaGenerator.asArray(bdmCustomQueries)
        );
      }

      let queries = attributeQueries.concat(constraintQueries, customQueries);
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

  private generateAttributes(bdmAttsArray: any[], attributesTypeMap: Map<string, string>) {
    for (let bdmAtt of bdmAttsArray) {
      let mandatoryStr = bdmAtt._attributes.nullable === 'true' ? '' : '!';
      let type = GraphqlSchemaGenerator.xmlToGraphqlType(bdmAtt._attributes.type);
      if (bdmAtt._attributes.collection === 'true') {
        type = '[' + type + ']';
      }
      let name = bdmAtt._attributes.name;
      this.schema.push('\t', name, ': ', type + mandatoryStr, '\n');
      attributesTypeMap.set(name, type);
    }
  }

  private generateRelationAttributes(bdmRelAttsArray: any[]) {
    for (let bdmRelAtt of bdmRelAttsArray) {
      let relType = GraphqlSchemaGenerator.getQualifiedName(bdmRelAtt._attributes.reference);
      let mandatoryStr = bdmRelAtt._attributes.nullable === 'true' ? '' : '!';
      this.schema.push('\t', bdmRelAtt._attributes.name, ': ', relType + mandatoryStr, '\n');
    }
  }

  private static getAttributeQueries(bdmObjectName: string, bdmAttsArray: any[]): string[] {
    //   findByName(name: String!): Customer
    //   ...
    //   find: Customer
    let queries: string[] = [];
    for (let bdmAtt of bdmAttsArray) {
      // Do not generate query for collection attribute
      if (bdmAtt._attributes.collection === 'true') {
        continue;
      }
      let attName = bdmAtt._attributes.name;
      let type = GraphqlSchemaGenerator.xmlToGraphqlType(bdmAtt._attributes.type);
      queries.push(
        'findBy' +
          GraphqlSchemaGenerator.capitalizeFirstLetter(attName) +
          '(' +
          attName +
          ': ' +
          type +
          '!): ' +
          bdmObjectName
      );
    }

    // Generate find() query
    queries.push('find: ' + bdmObjectName);

    // Generate findByPersistenceId() query
    queries.push('findByPersistenceId(persistenceId: Int!): ' + bdmObjectName);

    return queries;
  }

  private getQueriesFromConstraints(
    bdmObjectName: string,
    bdmConstraintsArray: any[],
    attributesTypeMap: Map<string, string>
  ): string[] {
    // e.g. :
    //   findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer
    //   ...
    let queries: string[] = [];
    for (let bdmConstraint of bdmConstraintsArray) {
      let parameters = bdmConstraint.fieldNames.fieldName;
      let params: string[] = [];
      let paramsCap: string[] = [];
      let parametersArray = GraphqlSchemaGenerator.asArray(parameters);
      for (let parameter of parametersArray) {
        let paramName = parameter._text;
        params.push(paramName);
        paramsCap.push(GraphqlSchemaGenerator.capitalizeFirstLetter(paramName));
      }
      let findParametersArr: string[] = [];
      params.forEach(param => {
        findParametersArr.push(param + ': ' + attributesTypeMap.get(param) + '!');
      });
      queries.push(
        'findBy' +
          paramsCap.join('And') +
          '(' +
          findParametersArr.join(', ') +
          '): ' +
          bdmObjectName
      );
    }
    return queries;
  }

  private getCustomQueries(bdmObjectName: string, customQueries: any[]): string[] {
    // e.g. :
    //   query1(name: String!): [Customer]
    //   ...
    let queries: string[] = [];
    for (let customQuery of customQueries) {
      let queryName = customQuery._attributes.name;
      let bdmReturnType = customQuery._attributes.returnType;
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
      let parameters = customQuery.queryParameters.queryParameter;
      let paramsStr = '';
      if (parameters) {
        paramsStr = this.generateQueryParamsString(parameters);
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

  private generateQueryParamsString(parameters: any): string {
    // e.g. :
    // (name: String!)

    // Map of paramName, paramType
    let paramsMap = new Map();
    let parametersArray = GraphqlSchemaGenerator.asArray(parameters);
    for (let parameter of parametersArray) {
      let paramName = parameter._attributes.name;
      let paramType = parameter._attributes.className;
      let type = GraphqlSchemaGenerator.getLastItem(paramType);
      if (type.endsWith(';')) {
        // this is a type of xml form '[Ljava.lang.String;', so an array
        // Here, the last item is something like 'String;' => [String] in GraphQL
        type = '[' + type.substring(0, type.length - 1) + ']';
      }
      paramsMap.set(paramName, GraphqlSchemaGenerator.xmlToGraphqlType(type));
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
