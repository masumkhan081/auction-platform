/* eslint-disable no-unused-vars */
const cors = require("cors");
const express = require("express");
const httpStatus = require("http-status");
const RootRoutes = require("./root.route");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const winston = require("winston");
const originControl = require("./middlewares/corsMiddleware")
//

const app = express();

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// need to organize how message format looks like
// app.use(
//   morgan("combined", {
//     stream: {
//       write: (message) => logger.info(message.trim()),
//     },
//   })
// );

app.use(originControl);
//

const publicDir = path.join(__dirname, "public");
// just to ensure the public folder exists or create it, as after git push empty folder doesn't get pushed
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log("Public folder created.");
}

//
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static("public"));
//
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "I am functional !",
    data: null,
  });
});

app.use("/api", RootRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API not found. For: ${req.originalUrl}`,
    data: null,
  });
  next();
});

module.exports = app;
