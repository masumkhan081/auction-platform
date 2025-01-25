const mongoose = require("mongoose");
require("dotenv").config();
const { connect, set } = require("mongoose");

// function mongodbConnection() {
//   try {
//     mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })
//       .then((data) => console.log("db connected"))
//       .catch((err) => console.log(err.message));
//   } catch (error) {
//     console.error("❌ Mongodb connection failed: " + error.message);
//     process.exit(1); // Exit process on failure
//   }
// };

function initDB() {
  set("strictQuery", true);
  set("debug", process.env.MODE === "development");
  connect(process.env.DB_URL)
    .then((data) => console.log("db connected"))
    .catch((err) => console.log(err.message));
}

module.exports = { initDB }
