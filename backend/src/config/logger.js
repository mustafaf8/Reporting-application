const { createLogger, format, transports } = require("winston");
const path = require("path");

// Log seviyesini ortam değişkeninden al
const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "warn" : "info");

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: {
    service: "rmr-teklif-backend",
    version: process.env.npm_package_version || "1.0.0",
  },
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          }`;
        })
      ),
    }),
    // Error log file
    new transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new transports.File({
      filename: path.join("logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Security log file
    new transports.File({
      filename: path.join("logs", "security.log"),
      level: "warn",
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Morgan için stream
logger.stream = {
  write: (message) => {
    logger.http ? logger.http(message.trim()) : logger.info(message.trim());
  },
};

// Özel log metodları
logger.security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, { ...meta, type: "security" });
};

logger.business = (message, meta = {}) => {
  logger.info(`[BUSINESS] ${message}`, { ...meta, type: "business" });
};

logger.performance = (message, meta = {}) => {
  logger.info(`[PERFORMANCE] ${message}`, { ...meta, type: "performance" });
};

module.exports = logger;
