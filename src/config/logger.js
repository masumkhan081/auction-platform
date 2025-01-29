const winston = require("winston");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Ensure "logs" folder exists
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log("Logs folder created.");
}

// Create Winston logger
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logDir, "combined.log") }),
    ],
});

// Morgan middleware using Winston
const morganMiddleware = morgan("combined", {
    stream: {
        write: (message) => logger.info(message.trim()),
    },
});

module.exports = { logger, morganMiddleware };
