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
const { verifyToken } = require("../../utils/tokenisation.js");
const User = require("./auth.model.js");
const jwt = require("jsonwebtoken");
const { allowedRoles } = require("../../config/constants.js");
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
router.post("/test-auth-token", async (req, res) => {
  const { email, role, password } = req.body;
  try {
    let user = await User.findOne({ email, role, password });

    if (!user) {
      console.log("test-token:  doesn't exist !");
      user = User.create({
        email,
        password,
        role,
        profile: "66f25cf57ed2cbf857beb03f",
      });
    }

    console.log(
      "token on user: \n" +
      JSON.stringify({ userId: user.id, role: user.role, email }) +
      "\n" +
      JSON.stringify(user)
    );
    res.json(
      jwt.sign(
        { userId: user.id, role: user.role, email },
        config.tokenSecret,
        config.jwtOptions
      )
    );
  } catch (error) {
    res.json("error");
  }
});

module.exports = router;
