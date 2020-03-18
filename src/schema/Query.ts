import { Filter } from './Filter';

export class Query {
  private name: string;
  private filters: Array<Filter>;

  constructor(name: string, filters: Array<Filter>) {
    this.name = name;
    this.filters = filters;
  }
}
