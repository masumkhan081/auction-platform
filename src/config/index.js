/* eslint-disable no-undef */
require("dotenv").config();

const config = {
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  appName: "auction-platform",
  port: process.env.PORT || 3000,
  dbUrl:
    process.env.DB_URL ||
    "mongodb+srv://masumkhan:passme@cluster0.bpxry.mongodb.net/",
  tokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || "i-act-as-token-secret",
  refreshTokenSecret:
    process.env.JWT_REFRESH_TOKEN_SECRET || "i-act-as-refresh-token-secret",
  tokenHeaderKey: process.env.tokenHeaderKey || "authorization",
  hostEmail: process.env.HOST_EMAIL || "masumkhan081.3s@gmail.com",
  hostEmailPassword: process.env.HOST_EMAIL_PASSWORD || "uigctmtbjzdyfxoa",
  mailHost: process.env.MAIL_HOST || "smtp.gmail.com",
  saltRounds: 12,
  jwtOptions: {
    expiresIn: "730h", // Token will expire after 30 days
  },
};

module.exports = config;
