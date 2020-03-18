export class Attribute {
  private name: string;
  private type: string;
  private nullable: boolean;

  constructor(name: string, type: string, nullable: boolean) {
    this.name = name;
    this.type = type;
    this.nullable = nullable;
  }
}
