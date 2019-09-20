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

/**
 * Process each parameter and build a config object
 * @type {module.ManageParameters}
 */

class ManageParameters {
  buildConfig(argvs) {
    function getParameter(param) {
      return param.substr(param.indexOf('=') + 1);
    }

    let parameterConfig = [];
    let fileConfig = {};
    argvs.forEach(function(val) {
      if (val.startsWith('config')) {
        try {
          let data = fs.readFileSync(getParameter(val), 'utf8');
          fileConfig = JSON.parse(data);
        } catch (error) {
          console.error(`Failed when loaded ${getParameter(val)} file. `, error);
        }
      }
      if (val.startsWith('bdmFile')) {
        parameterConfig.bdmFile = getParameter(val);
      }
      if (val.startsWith('port')) {
        let param = getParameter(val);
        if (!isNaN(param)) {
          parameterConfig.port = param;
        } else {
          console.error(`Invalid port: ${param}`);
          process.exit(1);
        }
      }

      // healCheck parameter
      if (val.startsWith('healthCheckHost')) {
        parameterConfig.healthCheckHost = getParameter(val);
      }
      if (val.startsWith('healthCheckUrl')) {
        parameterConfig.healthCheckUrl = getParameter(val);
      }
      if (val.startsWith('healthCheckPort')) {
        parameterConfig.healthCheckPort = getParameter(val);
      }
      //Log file output
      if (val.startsWith('logLevel')) {
        parameterConfig.logLevel = getParameter(val);
      }
      if (val.startsWith('logFile')) {
        parameterConfig.logFile = getParameter(val);
      }
    });
    let config = {};

    if (Object.keys(fileConfig).length > 0) {
      Object.keys(fileConfig).forEach(key => {
        config[key] = parameterConfig[key] || fileConfig[key];
      });
    } else {
      config = Object.assign(config, parameterConfig);
    }

    return config;
  }
}

module.exports = new ManageParameters();
