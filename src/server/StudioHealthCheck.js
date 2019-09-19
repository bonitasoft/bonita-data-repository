const request = require('request');
const winston = require('winston');

/**
 * @type {module.StudioHealthCheck}
 */
module.exports = class StudioHealthCheck {
  constructor(workspaceApiUrl, port) {
    this.workspaceApiUrl = workspaceApiUrl;
    this.port = port;
    this.logger = winston.loggers.get('bo-logger');
  }

  /**
   * Request endpoint and close process if error
   */
  healthCheck() {
    request(`https://localhost:${this.port}/${this.workspaceApiUrl}/status/`, function(
      error,
      response,
      body
    ) {
      if (error || response.statusCode !== 200) {
        try {
          this.logger.error('Connexion with Studio lost. Shutdown incoming');
          process.exit(1);
        } catch (ex) {
          next(ex);
        }
      }
    });
  }

  /**
   * Call HealthCheck periodically
   * @param interval
   */
  healthCheckWithInterval(interval) {
    setInterval(this.healthCheck.bind(this), interval);
  }
};
