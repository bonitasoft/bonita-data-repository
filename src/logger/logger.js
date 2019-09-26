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
'use strict';

const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class Logger {
  init(config) {
    let label = '';
    if (process.mainModule) {
      label = path.basename(process.mainModule.filename);
    }
    winston.loggers.add('bo-logger', {
      format: winston.format.combine(
        winston.format.label({ label: label }),
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(info => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        })
      ),
      transports: [
        new winstonDailyRotateFile({
          filename: `${config.logFile || './logs/'}/data-repository%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: config.logLevel || 'info',
          maxFiles: '14'
        }),
        new winston.transports.Console({
          level: config.logLevel || 'info'
        })
      ]
    });
  }
}
module.exports = new Logger();
