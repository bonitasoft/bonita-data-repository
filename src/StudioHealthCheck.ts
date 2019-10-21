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

export class StudioHealthCheck {
  private readonly host: string;
  private readonly port: number;
  private readonly url: string;
  private readonly logger: any;

  constructor(host: string, url: string, port: number) {
    this.host = host || 'http://localhost';
    this.url = url;
    this.port = port;
    this.logger = winston.loggers.get('bo-logger');
    this.logger.debug(`${this.host}:${this.port}${this.url}`);
  }

  getRequestUrl(): string {
    return `${this.host}:${this.port}${this.url}`;
  }

  getHost(): string {
    return this.host;
  }

  getPort(): number {
    return this.port;
  }

  getUrl(): string {
    return this.url;
  }

  /**
   * Request endpoint and close process if error
   */
  healthCheck() {
    let myself = this;
    request(this.getRequestUrl(), function(error: any, response: any, body: any) {
      if (error || response.statusCode !== 200) {
        myself.logger.error('Connexion with Studio lost. Shutdown incoming');
        process.exit(1);
      }
    });
  }

  /**
   * Call HealthCheck periodically
   * @param interval
   */
  healthCheckWithInterval(interval: number) {
    setInterval(this.healthCheck.bind(this), interval);
  }
}
