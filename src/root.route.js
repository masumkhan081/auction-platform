/* eslint-disable no-unused-vars */
const { Router } = require("express");
const router = Router();
//    auth & profiles
const authRoutes = require("./modules/auth/auth.route");
//
const routes = [
  {
    path: "/auth",
    route: authRoutes,
  },
];

routes.forEach((route) => router.use(route?.path, route?.route));

module.exports = router;
