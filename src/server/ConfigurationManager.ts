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

const fs = require('fs');
import { Configuration } from './Configuration';

/**
 * Process each parameter and build a Configuration
 */

export class ConfigurationManager {
  private readonly config: Configuration;

  constructor(argvs: string[]) {
    this.config = new Configuration();
    for (let param of argvs) {
      if (param.startsWith('config')) {
        this.initConfigFromFile(ConfigurationManager.getParameter(param));
      }

      // Note: in-line parameters may override config file parameters
      if (param.startsWith('bdmFile')) {
        this.config.bdmFile = ConfigurationManager.getParameter(param);
      }
      if (param.startsWith('host')) {
        this.config.host = ConfigurationManager.getParameter(param);
      }
      if (param.startsWith('port')) {
        this.config.port = ConfigurationManager.getPort(ConfigurationManager.getParameter(param));
      }

      // healCheck parameters
      if (param.startsWith('healthCheckHost')) {
        this.config.healthCheckHost = ConfigurationManager.getParameter(param);
      }
      if (param.startsWith('healthCheckUrl')) {
        this.config.healthCheckUrl = ConfigurationManager.getParameter(param);
      }
      if (param.startsWith('healthCheckPort')) {
        this.config.healthCheckPort = ConfigurationManager.getPort(
          ConfigurationManager.getParameter(param)
        );
      }

      // Log parameters
      if (param.startsWith('logLevel')) {
        this.config.logLevel = ConfigurationManager.getParameter(param);
      }
      if (param.startsWith('logFile')) {
        this.config.logFile = ConfigurationManager.getParameter(param);
      }
    }
  }

  public getConfig(): Configuration {
    return this.config;
  }

  //
  // Private methods
  //

  private static getParameter(param: string): any {
    return param.substr(param.indexOf('=') + 1);
  }

  private static getPort(portStr: string): number {
    let port: number = Number(portStr);
    if (!isNaN(port)) {
      return port;
    } else {
      console.error('Invalid port: ' + port);
      process.exit(1);
      return 0; // for method signature only
    }
  }

  private initConfigFromFile(configFile: string) {
    try {
      let data = fs.readFileSync(configFile, 'utf8');
      let fileConfig = JSON.parse(data);
      this.config.bdmFile = fileConfig.bdmFile;
      this.config.host = fileConfig.host;
      this.config.port = fileConfig.port;
      this.config.logFile = fileConfig.logFile;
      this.config.logLevel = fileConfig.logLevel;
      this.config.healthCheckUrl = fileConfig.healthCheckUrl;
      this.config.healthCheckHost = fileConfig.healthCheckHost;
      this.config.healthCheckPort = fileConfig.healthCheckPort;
    } catch (error) {
      console.error('Failed when loaded ' + configFile + ' file', error);
    }
  }
}
