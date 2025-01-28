const mongoose = require("mongoose");
require("dotenv").config();
const { connect, set } = require("mongoose");

const mongodbConnection = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      dbName: "e-com-shop",
    });
    console.log("Mongodb connected!");
  } catch (error) {
    console.log("Mongodb not connected!");
  }
};

function initDB() {
  set("strictQuery", true);
  set("debug", process.env.MODE === "development");
  connect(process.env.DB_URL)
    .then((data) => console.log("db connected"))
    .catch((err) => console.log(err.message));
}

module.exports = { initDB, mongodbConnection }
