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
class GraphqlSchemaGenerator {
  constructor(bdmJson) {
    if (!bdmJson) {
      throw 'Missing Bdm parameter';
    }
    this.bdmJson = bdmJson;
    this.schema = [];
    this.resolvers = [];
  }

  generate() {
    let bdm = JSON.parse(this.bdmJson);

    // Generate types
    let attributesTypeMap = new Map();
    if (
      !bdm ||
      !bdm.businessObjectModel ||
      !bdm.businessObjectModel.businessObjects ||
      !bdm.businessObjectModel.businessObjects.businessObject
    ) {
      return;
    }
    let bdmBusObjects = this._asArray(bdm.businessObjectModel.businessObjects.businessObject);
    let myself = this;
    bdmBusObjects.forEach(function(bdmBusObject) {
      let bdmObjectName = myself._getQualifiedName(bdmBusObject._attributes.qualifiedName);
      myself.schema.push('type ', bdmObjectName, ' {\n');
      let bdmAtts = bdmBusObject.fields.field;
      if (bdmAtts) {
        myself._generateAttributes(myself._asArray(bdmAtts), attributesTypeMap);
      }
      let bdmAttRels = bdmBusObject.fields.relationField;
      if (bdmAttRels) {
        myself._generateRelationAttributes(myself._asArray(bdmAttRels));
      }
      myself.schema.push('}\n\n');
    });

    //
    // Query generation
    //

    // Generate queries
    let bdmObjectsWithQuery = [];
    bdmBusObjects.forEach(function(bdmBusObject) {
      let bdmObjectName = myself._getQualifiedName(bdmBusObject._attributes.qualifiedName);
      // We may have no queries if no attribute (only relations)
      let queries = [];
      // Generate default queries
      let bdmAtts = bdmBusObject.fields.field;
      if (bdmAtts) {
        myself._generateAttributeQueries(queries, bdmObjectName, myself._asArray(bdmAtts));
      }
      // Generate default queries from unique constraints
      let constraints = bdmBusObject.uniqueConstraints.uniqueConstraint;
      if (constraints) {
        myself._generateQueriesFromConstraints(
          queries,
          bdmObjectName,
          myself._asArray(constraints),
          attributesTypeMap
        );
      }
      // Generate custom queries
      let customQueries = bdmBusObject.queries.query;
      if (customQueries) {
        myself._generateCustomQueries(queries, bdmObjectName, myself._asArray(customQueries));
      }

      if (queries.length !== 0) {
        myself.schema.push(queries.join(''));
        myself._generateBdmObjectQuery(bdmObjectName, bdmAtts, constraints, customQueries);
        bdmObjectsWithQuery.push(bdmObjectName);
      }
    });

    // Generate enums (?)
    // Add documentation for graphQL (?)

    // This is the (mandatory) Query root.
    this._generateRootQuery(bdmObjectsWithQuery);
  }

  getResolvers() {
    this.resolvers = this._generateInfoResolver();
    return this.resolvers;
  }

  getSchema() {
    return this.schema.join('');
  }

  _generateAttributes(bdmAttsArray, attributesTypeMap) {
    let myself = this;
    bdmAttsArray.forEach(bdmAtt => {
      let mandatoryStr = bdmAtt._attributes.nullable === 'true' ? '' : '!';
      let type = myself._xmlToGraphqlType(bdmAtt._attributes.type);
      let name = bdmAtt._attributes.name;
      myself.schema.push('\t', name, ': ', type + mandatoryStr, '\n');
      attributesTypeMap.set(name, type);
    });
  }

  _generateRelationAttributes(bdmRelAttsArray) {
    let myself = this;
    bdmRelAttsArray.forEach(bdmRelAtt => {
      let relType = this._getQualifiedName(bdmRelAtt._attributes.reference);
      let mandatoryStr = bdmRelAtt._attributes.nullable === 'true' ? '' : '!';
      myself.schema.push('\t', bdmRelAtt._attributes.name, ': ', relType + mandatoryStr, '\n');
    });
  }

  _generateAttributeQueries(queries, bdmObjectName, bdmAttsArray) {
    // e.g. :
    // type CustomerAttributeQuery {
    //   findByName(name: String!): Customer
    //   ...
    //   find: Customer
    // }
    queries.push('type ', bdmObjectName, 'AttributeQuery {\n');
    let myself = this;
    bdmAttsArray.forEach(bdmAtt => {
      let attName = bdmAtt._attributes.name;
      let type = myself._xmlToGraphqlType(bdmAtt._attributes.type);
      queries.push(
        '\t',
        'findBy',
        myself._capitalizeFirstLetter(attName),
        '(',
        attName,
        ': ',
        type,
        '!): ',
        bdmObjectName,
        '\n'
      );
    });
    queries.push('\t', 'find: ', bdmObjectName, '\n');
    queries.push('}\n\n');
  }

  _generateQueriesFromConstraints(queries, bdmObjectName, bdmConstraintsArray, attributesTypeMap) {
    // e.g. :
    // type CustomerConstraintQuery {
    //   findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer
    //   ...
    // }
    queries.push('type ', bdmObjectName, 'ConstraintQuery {\n');
    let myself = this;
    bdmConstraintsArray.forEach(bdmConstraint => {
      let parameters = bdmConstraint.fieldNames.fieldName;
      let params = [];
      let paramsCap = [];
      let parametersArray = myself._asArray(parameters);
      parametersArray.forEach(parameter => {
        let paramName = parameter._text;
        params.push(paramName);
        paramsCap.push(myself._capitalizeFirstLetter(paramName));
      });
      let findParametersArr = [];
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
    });
    queries.push('}\n\n');
  }

  _generateCustomQueries(queries, bdmObjectName, customQueries) {
    // e.g. :
    // type CustomerCustomQuery {
    //   query1(name: String!): [Customer]
    //   ...
    // }
    queries.push('type ', bdmObjectName, 'CustomQuery {\n');
    let myself = this;
    customQueries.forEach(customQuery => {
      let queryName = customQuery._attributes.name;
      let bdmReturnType = customQuery._attributes.returnType;
      let returnType;
      if (bdmReturnType === 'java.util.List') {
        returnType = '[' + bdmObjectName + ']';
      } else if (myself._getQualifiedName(bdmReturnType) === bdmObjectName) {
        returnType = bdmObjectName;
      } else {
        returnType = myself._xmlToGraphqlType(myself._getLastItem(bdmReturnType));
      }
      let parameters = customQuery.queryParameters.queryParameter;
      let paramsStr = '';
      if (parameters) {
        // Map of paramName, paramType
        let paramsMap = new Map();
        let parametersArray = myself._asArray(parameters);
        parametersArray.forEach(parameter => {
          let paramName = parameter._attributes.name;
          let paramType = parameter._attributes.className;
          paramsMap.set(paramName, myself._xmlToGraphqlType(myself._getLastItem(paramType)));
        });
        let paramsStringArray = [];
        paramsMap.forEach((value, key) => {
          paramsStringArray.push(key + ': ' + value + '!');
        });
        paramsStr = '(' + paramsStringArray.join(', ') + ')';
      }

      queries.push('\t', queryName, paramsStr, ': ', returnType, '\n');
    });
    queries.push('}\n\n');
  }

  _generateBdmObjectQuery(bdmObjectName, bdmAtts, constraints, customQueries) {
    // e.g. :
    // type CustomerQuery {
    //  attributeQuery: CustomerAttributeQuery
    //  constraintQuery: CustomerConstraintQuery
    //  customQuery: CustomerCustomQuery
    // }
    this.schema.push('type ', bdmObjectName, 'Query {\n');
    if (bdmAtts) {
      this._generateBdmObjectQueryItem(bdmObjectName, 'AttributeQuery');
    }
    if (constraints) {
      this._generateBdmObjectQueryItem(bdmObjectName, 'ConstraintQuery');
    }
    if (customQueries) {
      this._generateBdmObjectQueryItem(bdmObjectName, 'CustomQuery');
    }
    this.schema.push('}\n\n');
  }

  _generateBdmObjectQueryItem(bdmObjectName, queryName) {
    let queryType = bdmObjectName + queryName;
    this.schema.push('\t', this._lowercaseFirstLetter(queryName), ': ', queryType, '\n');
  }

  _generateRootQuery(bdmObjectsWithQuery) {
    // e.g. :
    // type Query {
    //  customerQuery: CustomerQuery
    //  ...
    // }
    this.schema.push('type ', 'Query {\n');
    let myself = this;
    bdmObjectsWithQuery.forEach(bdmObjectName => {
      myself._generateRootQueryItem(bdmObjectName);
    });
    this.schema.push('}\n\n');
  }

  _generateRootQueryItem(bdmObjectName) {
    let queryName = bdmObjectName + 'Query';
    this.schema.push('\t', this._lowercaseFirstLetter(queryName), ': ', queryName, '\n');
  }

  _generateInfoResolver() {
    return { Query: { info: () => `This is the API of BDM repository` } };
  }

  _xmlToGraphqlType(xmlType) {
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

  _asArray(element) {
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

  _getLastItem(path) {
    return path.substring(path.lastIndexOf('.') + 1);
  }

  _capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  _lowercaseFirstLetter(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  _getQualifiedName(dotQualifiedName) {
    // Replace '.' by '_', since graphQL does not support '.' in names
    return dotQualifiedName.replace(/\./g, '_');
  }
}

module.exports = GraphqlSchemaGenerator;
