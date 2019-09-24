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
const ManageParameters = require('../src/server/ManageParameters');
const mock = require('mock-fs');

describe('ManageParameters', () => {
  test('should build load config file when config parameter is define', () => {
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

    let config = ManageParameters.buildConfig(['config=configs/development.json']);

    expect(config.port).toBe('4000');
    expect(config.bdmFile).toBe('resources/bomAG2R.xml');
    expect(config.logFile).toBe('target/log/data-repository.log');
    expect(config.logLevel).toBe('debug');
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

    let config = ManageParameters.buildConfig(['config=configs/development.json', 'port=4444']);

    expect(config.port).toBe('4444');
    expect(config.bdmFile).toBe('resources/bomAG2R.xml');
    expect(config.logFile).toBe('target/log/data-repository.log');
    expect(config.logLevel).toBe('debug');
  });

  test('should build parameter when parameters is only given on starting', () => {
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

    let config = ManageParameters.buildConfig([
      'port=4444',
      'logFile=target/log/data-repository.log',
      'logLevel=debug'
    ]);

    expect(config.port).toBe('4444');
    expect(config.bdmFile).toBe(undefined);
    expect(config.logFile).toBe('target/log/data-repository.log');
    expect(config.logLevel).toBe('debug');
  });
});
