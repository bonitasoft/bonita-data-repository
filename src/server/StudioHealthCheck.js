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
const request = require('request');
const winston = require('winston');

/**
 * @type {module.StudioHealthCheck}
 */
class StudioHealthCheck {
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
}

module.exports = StudioHealthCheck;