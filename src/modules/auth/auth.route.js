const { Router } = require("express");
const router = Router();
const authController = require("./auth.controller.js");
const validateRequest = require("../../middlewares/validateRequest.js");
const {
  loginSchema,
  registerSchema,
  emailSchema,
  otpVerSchema,
  resetPassSchema,
} = require("./auth.validate.js");
const config = require("../../config/index.js");
const {
  verifyToken,
  getHashedPassword,
} = require("../../utils/tokenisation.js");
const User = require("./auth.model.js");
const jwt = require("jsonwebtoken");
const { allowedRoles, operableEntities } = require("../../config/constants.js");
const Profile = require("../profile/profile.model.js");
const { sendErrorResponse } = require("../../utils/responseHandler.js");
//
router.post(
  "/register-as-bidder",
  validateRequest(registerSchema),
  authController.registerUser(allowedRoles.bidder)
);
//
router.post(
  "/register-as-seller",
  validateRequest(registerSchema),
  authController.registerUser(allowedRoles.seller)
);
//
router.post(
  "/email-verification",
  validateRequest(otpVerSchema),
  authController.verifyEmail
);
//
router.post(
  "/request-email-verification",
  validateRequest(emailSchema),
  authController.requestEmailVerfication
);
//
router.post("/login", validateRequest(loginSchema), authController.login);

// router.get("/logout", authController.logout);

router.post(
  "/recovery",
  validateRequest(emailSchema),
  authController.requestAccountRecovery
);
//
router.get("/recovery/:token", authController.verifyAccountRecovery);
//
router.post(
  "/reset-password",
  validateRequest(resetPassSchema),
  authController.updatePassword
);
//
// test user generation to get token to check accessControl middlewre
//
router.post("/test-auth-token", async (req, res) => {
  // no validation added regarding these field values as it's just for generating test token with different roles
  const { email, role, password, fullName, gender, phone, address } = req.body;
  let user;
  let profile;
  try {
    profile = await Profile.findOne({ phone });
    user = await User.findOne({ email, role, password });
    if (profile || user) {
      return res.status(400).json({
        success: false,
        message:
          "data alrady used. note: this api just to generate token with 3 roles to avoid full auth process if intended",
      });
    }

    const hashedPw = await getHashedPassword(password);

    profile = await Profile.create({
      fullName,
      gender,
      phone,
      address,
    });

    user = await User.create({
      email,
      password:hashedPw,
      role,
      profile: profile.id,
      isVerified: true,
    });

    res.status(200).json({
      success: true,
      token: jwt.sign(
        { userId: user.id, role: user.role, email },
        config.tokenSecret,
        config.jwtOptions
      ),
      message: "set it in postman environment var",
    });
  } catch (error) {
    if (profile) {
      await Profile.findByIdAndDelete(profile.id);
    }
    if (user) {
      await User.findByIdAndDelete(user.id);
    }
    return sendErrorResponse({ res, error, what: operableEntities.user });
    // res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
