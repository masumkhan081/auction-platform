/* eslint-disable no-undef */
const app = require("./src/app");
const mongodbConnection = require("./src/config/mongodb");
const config = require("./src/config");
require("dotenv").config();

async function bootstrap() {
  const server = app.listen(config.port, async () => {
    console.log(`Server running on port ${config.port}`);
    await mongodbConnection();
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
    console.log(error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);
}

bootstrap();
