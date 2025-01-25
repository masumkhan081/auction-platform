const express = require("express");
const app = express();
require("dotenv").config();
const { initDB } = require("./src/config/mongodb");
const originControl = require("./src/middlewares/corsMiddleware")
// initialize the database
initDB();
// middlewares
app.use(originControl);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 
app.listen(3000, () => {
    console.log("running ...");
});
// 
app.get("/", (req, res) => {
    res.send("Home !!");
});
// server closing endpoint; no need what so ever
app.get("/Hi", (req, res) => {
    res.send("Hello");
});