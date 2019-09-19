const ManageParameters = require('./ManageParameters');
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
