'use strict';

const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class Logger {
  init(config) {
    winston.loggers.add('bo-logger', {
      format: winston.format.combine(
        winston.format.label({ label: path.basename(process.mainModule.filename) }),
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
