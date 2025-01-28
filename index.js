const express = require("express");
const app = express();
require("dotenv").config();
const RootRoutes = require("./src/root.route");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const winston = require("winston");
const { initDB, mongodbConnection } = require("./src/config/mongodb");
const originControl = require("./src/middlewares/corsMiddleware")
// 
// initialize the database
// mongodbConnection();
initDB();
// middlewares
// app.use(originControl);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const publicDir = path.join(__dirname, "public");
// just to ensure the public folder exists or create it.
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("Public folder created.");
}
app.use("/public", express.static("public"));
// 
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
//
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "I am functional !",
        data: null,
    });
});
// 
// server closing endpoint; no need what so ever
app.get("/Hi", (req, res) => {
    res.send("Hello");
});
// 
app.listen(3000, () => {
    console.log("running ...");
});