/* eslint-disable no-unused-vars */
const { Router } = require("express");
const router = Router();
// const authRoutes = require("./modules/auth/auth.route");
const categoryRoutes = require("./modules/category/category.route");
const productRoutes = require("./modules/product/product.route");
// const auctionRoutes = require("./modules/auction/auction.route");
// const bidRoutes = require("./modules/bids/bid.route");
// const feedbackRoutes = require("./modules/feedback/feedback.route");
// const profileRoutes = require("./modules/profile/profile.route")
//
const routes = [
  // {
  //   path: "/auth",
  //   route: authRoutes,
  // },
  {
    path: "/product-categories",
    route: categoryRoutes,
  },
  {
    path: "/products",
    route: productRoutes,
  },
  // {
  //   path: "/auctions",
  //   route: auctionRoutes,
  // },
  // {
  //   path: "/bids",
  //   route: bidRoutes,
  // },
  // {
  //   path: "/feedbacks",
  //   route: feedbackRoutes,
  // },
  // {
  //   path: "/profile",
  //   route: profileRoutes,
  // },
];

routes.forEach((route) => router.use(route?.path, route?.route));

module.exports = router;
