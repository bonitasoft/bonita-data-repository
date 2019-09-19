const fs = require('fs');

function getParameter(param) {
  return param.substr(param.indexOf('=') + 1);
}

/**
 * Process each parameter and build a config object
 * @type {module.ManageParameters}
 */

class ManageParameters {
  buildConfig(argvs) {
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
