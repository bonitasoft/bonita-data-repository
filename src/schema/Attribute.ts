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

export class Attribute {
  public name: string;
  public type: string;
  public nullable: boolean;
  public collection: boolean;
  public description: string;

  constructor(
    name: string,
    type: string,
    nullable: boolean,
    collection: boolean,
    description: string
  ) {
    this.name = name;
    this.type = type;
    this.nullable = nullable;
    this.collection = collection;
    this.description = description;
  }
}
