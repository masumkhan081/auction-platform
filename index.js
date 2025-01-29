const express = require("express");
const app = express();
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { initDB, mongodbConnection } = require("./src/config/mongodb");
const originControl = require("./src/middlewares/corsMiddleware")
const { morganMiddleware } = require("./src/config/logger");
// --------------------------------------------------- Routes
// const authRoutes = require("./src/modules/auth/auth.route");
const categoryRoutes = require("./src/modules/category/category.route");
// const productRoutes = require("./src/modules/product/product.route");
// const auctionRoutes = require("./src/modules/auction/auction.route");
// const bidRoutes = require("./src/modules/bids/bid.route");
// const feedbackRoutes = require("./src/modules/feedback/feedback.route");
// const profileRoutes = require("./src/modules/profile/profile.route")
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
// app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/auctions", auctionRoutes);
// app.use("/api/bids", bidRoutes);
// app.use("/api/feedbacks", feedbackRoutes);
// app.use("/api/profiles", profileRoutes);

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