import { Attribute } from './Attribute';
import { Query } from './Query';

export class BusinessObject {
  private qualifiedName: string;
  private name: string;
  private description: string;
  private attributes: Array<Attribute>;
  private attributeQueries: Array<Query>;
  private constraintQueries: Array<Query>;
  private customQueries: Array<Query>;

  constructor(
    qualifiedName: string,
    description: string,
    attributes: Array<Attribute>,
    attributeQueries: Array<Query>,
    constraintQueries: Array<Query>,
    customQueries: Array<Query>
  ) {
    this.qualifiedName = qualifiedName;
    this.name = <string>qualifiedName.split('.').pop();
    this.description = description;
    this.attributes = attributes;
    this.attributeQueries = attributeQueries;
    this.constraintQueries = constraintQueries;
    this.customQueries = customQueries;
  }
}
