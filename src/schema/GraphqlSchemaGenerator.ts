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
      // We may have no queries if no attribute (only relations)
      let queries: string[] = [];
      // Generate default queries
      let bdmAtts: string = bdmBusObject.fields.field;
      if (bdmAtts) {
        GraphqlSchemaGenerator.generateAttributeQueries(
          queries,
          bdmObjectName,
          GraphqlSchemaGenerator.asArray(bdmAtts)
        );
      }
      // Generate default queries from unique constraints
      let constraints = bdmBusObject.uniqueConstraints.uniqueConstraint;
      if (constraints) {
        this.generateQueriesFromConstraints(
          queries,
          bdmObjectName,
          GraphqlSchemaGenerator.asArray(constraints),
          attributesTypeMap
        );
      }
      // Generate custom queries
      let customQueries = bdmBusObject.queries.query;
      if (customQueries) {
        this.generateCustomQueries(
          queries,
          bdmObjectName,
          GraphqlSchemaGenerator.asArray(customQueries)
        );
      }

      if (queries.length !== 0) {
        this.schema.push(queries.join(''));
        this.generateBdmObjectQuery(bdmObjectName, bdmAtts, constraints, customQueries);
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

  private static generateAttributeQueries(
    queries: string[],
    bdmObjectName: string,
    bdmAttsArray: any[]
  ) {
    // e.g. :
    // type CustomerAttributeQuery {
    //   findByName(name: String!): Customer
    //   ...
    //   find: Customer
    // }
    queries.push('type ', bdmObjectName, 'AttributeQuery {\n');
    for (let bdmAtt of bdmAttsArray) {
      // Do not generate query for collection attribute
      if (bdmAtt._attributes.collection === 'true') {
        continue;
      }
      let attName = bdmAtt._attributes.name;
      let type = GraphqlSchemaGenerator.xmlToGraphqlType(bdmAtt._attributes.type);
      queries.push(
        '\t',
        'findBy',
        GraphqlSchemaGenerator.capitalizeFirstLetter(attName),
        '(',
        attName,
        ': ',
        type,
        '!): ',
        bdmObjectName,
        '\n'
      );
    }

    // Generate find() query
    queries.push('\t', 'find: ', bdmObjectName, '\n');

    // Generate findByPersistenceId() query
    queries.push('\t', 'findByPersistenceId(persistenceId: Int!): ', bdmObjectName, '\n');

    queries.push('}\n\n');
  }

  private generateQueriesFromConstraints(
    queries: string[],
    bdmObjectName: string,
    bdmConstraintsArray: any[],
    attributesTypeMap: Map<string, string>
  ) {
    // e.g. :
    // type CustomerConstraintQuery {
    //   findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer
    //   ...
    // }
    queries.push('type ', bdmObjectName, 'ConstraintQuery {\n');
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
        '\t',
        'findBy',
        paramsCap.join('And'),
        '(',
        findParametersArr.join(', '),
        '): ',
        bdmObjectName,
        '\n'
      );
    }
    queries.push('}\n\n');
  }

  private generateCustomQueries(queries: any[], bdmObjectName: string, customQueries: any[]) {
    // e.g. :
    // type CustomerCustomQuery {
    //   query1(name: String!): [Customer]
    //   ...
    // }
    queries.push('type ', bdmObjectName, 'CustomQuery {\n');
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
      queries.push('\t', queryName, paramsStr, ': ', returnType, '\n');
    }
    queries.push('}\n\n');
  }

  private generateBdmObjectQuery(
    bdmObjectName: string,
    bdmAtts: string,
    constraints: string,
    customQueries: string
  ) {
    // e.g. :
    // type CustomerQuery {
    //  attributeQuery: CustomerAttributeQuery
    //  constraintQuery: CustomerConstraintQuery
    //  customQuery: CustomerCustomQuery
    // }
    this.schema.push('type ', bdmObjectName, 'Query {\n');
    if (bdmAtts) {
      this.generateBdmObjectQueryItem(bdmObjectName, 'AttributeQuery');
    }
    if (constraints) {
      this.generateBdmObjectQueryItem(bdmObjectName, 'ConstraintQuery');
    }
    if (customQueries) {
      this.generateBdmObjectQueryItem(bdmObjectName, 'CustomQuery');
    }
    this.schema.push('}\n\n');
  }

  private generateBdmObjectQueryItem(bdmObjectName: string, queryName: string) {
    let queryType = bdmObjectName + queryName;
    this.schema.push(
      '\t',
      GraphqlSchemaGenerator.lowercaseFirstLetter(queryName),
      ': ',
      queryType,
      '\n'
    );
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
      case 'LOCALDATE':
      case 'LOCALDATETIME':
      case 'OFFSETDATETIME':
      case 'DATE':
      case 'TEXT':
        return 'String';
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
