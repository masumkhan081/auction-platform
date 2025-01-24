const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { initDB } = require("./src/config/mongodb");

// initialize the database
initDB();

// middlewares
const allowedOrigins = ["http://localhost:3001", "http://localhost:5173"];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 
app.listen(3000, () => {
    console.log("running ...");
});
// 
app.get("/", (req, res) => {
    res.send("Home");
});
// server closing endpoint; no need what so ever
app.get("/Hi", (req, res) => {
    res.send("Hello");
});