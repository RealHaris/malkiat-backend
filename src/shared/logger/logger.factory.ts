import * as fs from 'node:fs';
import * as path from 'node:path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

type LoggerOptions = {
  level: string;
  dir: string;
  maxFiles: string;
  maxSize: string;
};

export function createAppLogger(opts: LoggerOptions): winston.Logger {
  const logDir = opts.dir || 'logs';
  
  // Ensure log directory exists
  const logDirPath = path.resolve(process.cwd(), logDir);
  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath, { recursive: true });
  }

  const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
      const ctx =
        typeof context === 'string' && context.length ? ` [${context}]` : '';
      const ts = typeof timestamp === 'string' ? timestamp : '';
      const msg = typeof message === 'string' ? message : safeJson(message);
      const rest = Object.keys(meta).length ? ` ${safeJson(meta)}` : '';
      return `${ts} ${level}${ctx}: ${msg}${rest}`;
    }),
  );

  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  return winston.createLogger({
    level: opts.level,
    defaultMeta: {
      service: 'malkiat-backend',
    },
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new DailyRotateFile({
        dirname: path.resolve(process.cwd(), logDir),
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: opts.maxFiles,
        maxSize: opts.maxSize,
        format: fileFormat,
      }),
    ],
  });
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}
