/* eslint-disable no-undef */
const app = require("../src/app");
const { initDB } = require("../src/config/mongodb");
const config = require("../src/config");
require("dotenv").config();

async function bootstrap() {
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    initDB();
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  const unexpectedErrorHandler = (error) => {
    console.log("unexpectedErrorHandler: " + error.message);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);
}
bootstrap();


// initialize the database
// initDB();
//
// app.listen(3000, () => {
//   console.log("running ...");
// });

// // close the server
// app.get("/hi", function (req, res) {
//   res.send("hello");
// });

