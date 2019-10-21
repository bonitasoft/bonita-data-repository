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

import { BdrLogger } from '../src/logger/BdrLogger';
import { Configuration } from '../src/server/Configuration';
import { StudioHealthCheck } from '../src/StudioHealthCheck';

BdrLogger.init(new Configuration());

describe('StudioHealthCheck', () => {
  test('should init when parameter is given in parameter', () => {
    let healthCheck = new StudioHealthCheck('http://myHost', '/myCustomEndPoint/status', 64027);
    expect(healthCheck.getHost()).toBe('http://myHost');
    expect(healthCheck.getPort()).toBe(64027);
    expect(healthCheck.getUrl()).toBe('/myCustomEndPoint/status');
  });

  test('should init host when no host value is given in parameter', () => {
    let healthCheck = new StudioHealthCheck('', '/myCustomEndPoint/status', 64027);
    expect(healthCheck.getHost()).toBe('http://localhost');
    expect(healthCheck.getPort()).toBe(64027);
    expect(healthCheck.getUrl()).toBe('/myCustomEndPoint/status');
  });

  test('should build a valid request url', () => {
    let healthCheck = new StudioHealthCheck('', '/myCustomEndPoint/status', 64027);
    expect(healthCheck.getRequestUrl()).toBe('http://localhost:64027/myCustomEndPoint/status');
  });
});
