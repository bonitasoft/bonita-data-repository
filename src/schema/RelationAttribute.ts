import { Attribute } from './Attribute';

export class RelationAttribute extends Attribute {
  private reference: string;
  private fetchType: string;

  constructor(name: string, type: string, nullable: boolean, reference: string, fetchType: string) {
    super(name, type, nullable);
    this.reference = reference;
    this.fetchType = fetchType;
  }
}
