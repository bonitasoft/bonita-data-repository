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
      let bdmObjectName = myself._getLastItem(bdmBusObject._attributes.qualifiedName);
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
    bdmBusObjects.forEach(function(bdmBusObject) {
      let bdmObjectName = myself._getLastItem(bdmBusObject._attributes.qualifiedName);
      // We may have no queries if no attribute (only relations)
      let queries = [];
      // Generate default queries
      let bdmAtts = bdmBusObject.fields.field;
      if (bdmAtts) {
        myself._generateAttributeQueries(queries, bdmObjectName, myself._asArray(bdmAtts));
        queries.push('\t', 'find: ', bdmObjectName, '\n');
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
      //TODO

      if (queries.length !== 0) {
        myself.schema.push('type ', bdmObjectName, 'Query {\n');
        myself.schema.push(queries.join(''));
        myself.schema.push('}\n\n');
      }
    });

    // Generate enums (?)
    // Add documentation for graphQL (?)

    // This is the (mandatory) Query root.
    // Note: not used for now. Could be one of the current xxxQuery (?)
    this.schema.push('type Query ', '{\n', '\t', 'content: String', '\n', '}\n\n');
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
      let relType = this._getLastItem(bdmRelAtt._attributes.reference);
      let mandatoryStr = bdmRelAtt._attributes.nullable === 'true' ? '' : '!';
      myself.schema.push('\t', bdmRelAtt._attributes.name, ': ', relType + mandatoryStr, '\n');
    });
  }

  _generateAttributeQueries(queries, bdmObjectName, bdmAttsArray) {
    // e.g. : findByName(name: String!): Customer
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
  }

  _generateQueriesFromConstraints(queries, bdmObjectName, bdmConstraintsArray, attributesTypeMap) {
    // e.g : findByNameAndPhoneNumber(name: String!, phoneNumber: String!): Customer
    let myself = this;
    bdmConstraintsArray.forEach(bdmConstraint => {
      let parametersArray = bdmConstraint.fieldNames.fieldName;
      let params = [];
      let paramsCap = [];
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
  }

  _generateInfoResolver() {
    return { Query: { info: () => `This is the API of BDM repository` } };
  }

  _xmlToGraphqlType(xmlType) {
    switch (xmlType) {
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
}

module.exports = GraphqlSchemaGenerator;
