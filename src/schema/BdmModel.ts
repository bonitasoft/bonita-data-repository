import { BusinessObject } from './BusinessObject';

export class BdmModel {
  private _businessObjects: Array<BusinessObject> = [];

  get businessObjects(): Array<BusinessObject> {
    return this._businessObjects;
  }

  set businessObjects(value: Array<BusinessObject>) {
    this._businessObjects = value;
  }
}
