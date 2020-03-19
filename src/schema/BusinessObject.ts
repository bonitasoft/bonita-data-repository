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
