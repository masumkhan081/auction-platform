const express = require("express");
const app = express();
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { initDB, mongodbConnection } = require("./src/config/mongodb");
const originControl = require("./src/middlewares/corsMiddleware")
const { morganMiddleware } = require("./src/config/logger");
// --------------------------------------------------- Routes
// const apiRoutes = require("./src/root.route.js");
const categoryRoutes = require("./src/modules/category/category.route");
const productRoutes = require("./src/modules/product/product.route");
const auctionRoutes = require("./src/modules/auction/auction.route");
//  -------------------------------------------------- Middlewares
app.use(originControl);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(morganMiddleware);

const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("Public folder created.");
}
app.use("/public", express.static("public"));

// API Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auctions", auctionRoutes);

// Deployment Check - Root Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "I am functional !",
        data: null,
    });
});
// No Api
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `API not found. For: ${req.originalUrl}`,
        data: null,
    });
    next();
});

// Start Server
const startServer = async () => {
    await mongodbConnection();
    app.listen(3000, () => {
        console.log("Server is running on port 3000...");
    });
};
startServer();