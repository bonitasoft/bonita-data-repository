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

import { Attribute } from './Attribute';
import { BusinessObject } from './BusinessObject';
import { BdmModel } from './BdmModel';
import { Query } from './Query';
import { Filter } from './Filter';
import { RelationAttribute } from './RelationAttribute';
import { CustomQuery } from './CustomQuery';

export class BdmModelGenerator {
  private readonly bdmJson: string;
  private readonly bdmModel: BdmModel;

  constructor(bdmJson: string) {
    this.bdmJson = bdmJson;
    this.bdmModel = new BdmModel();
  }

  public getBdmModel() {
    return this.bdmModel;
  }

  public generate() {
    let bdm: any = JSON.parse(this.bdmJson);

    // Generate types
    if (
      !bdm ||
      !bdm.businessObjectModel ||
      !bdm.businessObjectModel.businessObjects ||
      !bdm.businessObjectModel.businessObjects.businessObject
    ) {
      return;
    }

    let bdmBusObjects: any[] = BdmModelGenerator.asArray(
      bdm.businessObjectModel.businessObjects.businessObject
    );
    let businessObjects = [];
    for (let bdmBusObject of bdmBusObjects) {
      let qualifiedName = bdmBusObject._attributes.qualifiedName;
      let bdmAtts = bdmBusObject.fields.field;
      let description = '';
      if (bdmBusObject.description) {
        description = bdmBusObject.description._text;
      }

      // Attributes
      let attributes: Array<Attribute> = [];
      if (bdmAtts) {
        attributes = BdmModelGenerator.getAttributes(BdmModelGenerator.asArray(bdmAtts));
      }
      let bdmAttRels = bdmBusObject.fields.relationField;
      let relAttributes: Array<RelationAttribute> = [];
      if (bdmAttRels) {
        relAttributes = BdmModelGenerator.getRelationAttributes(
          BdmModelGenerator.asArray(bdmAttRels)
        );
      }
      attributes = attributes.concat(relAttributes);

      // Attribute queries
      let attributeQueries = BdmModelGenerator.getAttributeQueries(
        BdmModelGenerator.asArray(bdmAtts)
      );

      // Queries from unique constraints
      let constraints = bdmBusObject.uniqueConstraints.uniqueConstraint;
      let constraintQueries = this.getQueriesFromConstraints(
        BdmModelGenerator.asArray(constraints),
        attributes
      );

      // Generate custom queries
      let bdmCustomQueries = bdmBusObject.queries.query;
      let customQueries = BdmModelGenerator.getCustomQueries(
        BdmModelGenerator.asArray(bdmCustomQueries)
      );

      businessObjects.push(
        new BusinessObject(
          qualifiedName,
          description,
          attributes,
          attributeQueries,
          constraintQueries,
          customQueries
        )
      );
    }
    this.bdmModel.businessObjects = businessObjects;
  }

  //
  // Private methods
  //

  private static getAttributes(bdmAttsArray: any[]): Array<Attribute> {
    let attributes: Array<Attribute> = [];
    for (let bdmAtt of bdmAttsArray) {
      let attribute = this.getAttribute(bdmAtt);
      attributes.push(attribute);
    }
    return attributes;
  }

  private static getRelationAttributes(bdmRelAttsArray: any[]): Array<RelationAttribute> {
    let relAttributes: Array<RelationAttribute> = [];
    for (let bdmRelAtt of bdmRelAttsArray) {
      let attribute = this.getAttribute(bdmRelAtt);
      let reference = bdmRelAtt._attributes.reference;
      let fetchType = bdmRelAtt._attributes.fetchType;
      relAttributes.push(new RelationAttribute(attribute, reference, fetchType));
    }
    return relAttributes;
  }

  private static getAttributeQueries(bdmAttsArray: any[]): Array<Query> {
    // e.g. :
    //   findByName(name: String!)
    //   ...
    //   find
    // }
    let attributeQueries: Array<Query> = [];
    for (let bdmAtt of bdmAttsArray) {
      // Do not generate query for collection attribute
      if (bdmAtt._attributes.collection === 'true') {
        continue;
      }
      let attName = bdmAtt._attributes.name;
      let type = bdmAtt._attributes.type;
      let collection = this.stringToBoolean(bdmAtt._attributes.collection);
      let queryName = 'findBy' + BdmModelGenerator.capitalizeFirstLetter(attName);
      let filter = new Filter(attName, type, collection);
      attributeQueries.push(new Query(queryName, BdmModelGenerator.asArray(filter)));
    }

    // find() query
    attributeQueries.push(new Query('find', []));

    // findByPersistenceId() query
    let filter = new Filter('persistenceId', 'INTEGER', false);
    attributeQueries.push(new Query('findByPersistenceId', BdmModelGenerator.asArray(filter)));

    return attributeQueries;
  }

  private getQueriesFromConstraints(
    bdmConstraintsArray: any[],
    attributes: Array<Attribute>
  ): Array<Query> {
    // e.g. :
    //   findByNameAndPhoneNumber(name: String!, phoneNumber: String!)
    //   ...
    let constraintQueries: Array<Query> = [];
    for (let bdmConstraint of bdmConstraintsArray) {
      let parameters = bdmConstraint.fieldNames.fieldName;
      let params: string[] = [];
      let paramsCap: string[] = [];
      let parametersArray = BdmModelGenerator.asArray(parameters);
      for (let parameter of parametersArray) {
        let paramName = parameter._text;
        params.push(paramName);
        paramsCap.push(BdmModelGenerator.capitalizeFirstLetter(paramName));
      }
      let filters: Array<Filter> = [];
      params.forEach(param => {
        let attribute = attributes.filter(attribute => attribute.name === param)[0];
        let type: string;
        if (attribute instanceof RelationAttribute) {
          type = attribute.reference;
        } else {
          type = attribute.type;
        }
        filters.push(new Filter(attribute.name, type, attribute.collection));
      });
      let queryName = 'findBy' + paramsCap.join('And');
      constraintQueries.push(new Query(queryName, filters));
    }
    return constraintQueries;
  }

  private static getCustomQueries(bdmCustomQueries: any[]) {
    // e.g. :
    //   query1(name: String!)
    //   ...
    let customQueries: Array<CustomQuery> = [];
    for (let bdmCustomQuery of bdmCustomQueries) {
      let queryName = bdmCustomQuery._attributes.name;
      let returnType = bdmCustomQuery._attributes.returnType;
      let parameters = bdmCustomQuery.queryParameters.queryParameter;
      let filters: Array<Filter> = [];
      if (parameters) {
        filters = BdmModelGenerator.getFilters(parameters);
      }
      let query = new Query(queryName, filters);
      customQueries.push(new CustomQuery(query, returnType));
    }
    return customQueries;
  }

  private static getFilters(parameters: any): Array<Filter> {
    // e.g. :
    // (name: String!)

    let parametersArray = BdmModelGenerator.asArray(parameters);
    let filters: Array<Filter> = [];
    for (let parameter of parametersArray) {
      let paramName = parameter._attributes.name;
      let paramType = BdmModelGenerator.getLastItem(parameter._attributes.className).toUpperCase();
      let paramCollection = false;
      if (paramType.endsWith(';')) {
        // this is a type such as '[Ljava.lang.String;', so an array
        paramType = paramType.substring(0, paramType.length - 1);
        paramCollection = true;
      }
      filters.push(new Filter(paramName, paramType, paramCollection));
    }
    return filters;
  }

  private static getAttribute(bdmAtt: any) {
    let name = bdmAtt._attributes.name;
    let type = bdmAtt._attributes.type;
    let nullable = BdmModelGenerator.stringToBoolean(bdmAtt._attributes.nullable);
    let collection = BdmModelGenerator.stringToBoolean(bdmAtt._attributes.collection);
    let description = '';
    if (bdmAtt.description) {
      description = bdmAtt.description._text;
    }
    return new Attribute(name, type, nullable, collection, description);
  }

  private static asArray(element: any): any[] {
    // Put element in an array (if needed)
    let arr;
    if (!Array.isArray(element)) {
      arr = [];
      if (element) {
        arr.push(element);
      }
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

  private static stringToBoolean(str: string): boolean {
    return str === 'true';
  }
}
