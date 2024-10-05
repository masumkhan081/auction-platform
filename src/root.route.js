/* eslint-disable no-unused-vars */
const { Router } = require("express");
const router = Router();
//    auth & profiles
const authRoutes = require("./modules/auth/auth.route");
const categoryRoutes = require("./modules/category/category.route");
const productRoutes = require("./modules/product/product.route");

//
const routes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  //
  {
    path: "/product-categories",
    route: categoryRoutes,
  },
  {
    path: "/products",
    route: productRoutes,
  },
];

routes.forEach((route) => router.use(route?.path, route?.route));

module.exports = router;
