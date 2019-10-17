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
import { ConfigurationManager } from '../src/server/ConfigurationManager';

const mock = require('mock-fs');

BdrLogger.init(new Configuration());

describe('ManageParameters', () => {
  test('should build load config file when config parameter is define', () => {
    mock({
      configs: {
        'development.json':
          '{\n' +
          '  "bdmFile": "resources/bomAG2R.xml",\n' +
          '  "host": "myHost",\n' +
          '  "port": "4000",\n' +
          '  "logFile": "target/log/data-repository.log",\n' +
          '  "logLevel": "debug",\n' +
          '  "healthCheckUrl": "/api/workspace/status",\n' +
          '  "healthCheckHost": "http://myHealthCheckHost",\n' +
          '  "healthCheckPort": "5051"\n' +
          '}\n',
        'empty-dir': {
          /** empty directory */
        }
      }
    });

    let manager = new ConfigurationManager(['config=configs/development.json']);
    let config = manager.getConfig();

    expect(config.host).toBe('myHost');
    expect(config.port).toBe('4000');
    expect(config.bdmFile).toBe('resources/bomAG2R.xml');
    expect(config.logFile).toBe('target/log/data-repository.log');
    expect(config.logLevel).toBe('debug');
    expect(config.healthCheckUrl).toBe('/api/workspace/status');
    expect(config.healthCheckHost).toBe('http://myHealthCheckHost');
    expect(config.healthCheckPort).toBe('5051');
    mock.restore();
  });

  test('should build override port parameter when is passed as parameter and in file config', () => {
    mock({
      configs: {
        'development.json':
          '{\n' +
          '  "port": "4000",\n' +
          '  "bdmFile": "resources/bomAG2R.xml",\n' +
          '  "logFile": "target/log/data-repository.log",\n' +
          '  "logLevel": "debug"\n' +
          '}\n',
        'empty-dir': {
          /** empty directory */
        }
      }
    });

    let config = new ConfigurationManager([
      'config=configs/development.json',
      'port=4444'
    ]).getConfig();

    expect(config.port).toBe(4444);
    expect(config.bdmFile).toBe('resources/bomAG2R.xml');
    expect(config.logFile).toBe('target/log/data-repository.log');
    expect(config.logLevel).toBe('debug');
    mock.restore();
  });

  test('should build parameter when parameters is only given on starting', () => {
    let config = new ConfigurationManager([
      'port=4444',
      'logFile=target/log/data-repository.log',
      'logLevel=debug'
    ]).getConfig();

    expect(config.port).toBe(4444);
    expect(config.bdmFile).toBe(undefined);
    expect(config.logFile).toBe('target/log/data-repository.log');
    expect(config.logLevel).toBe('debug');
    mock.restore();
  });
});
