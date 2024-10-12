const { Router } = require("express");
const router = Router();
const authController = require("./auth.controller.js");
const validateRequest = require("../../middlewares/validateRequest.js");
const {
  loginSchema,
  registerSchema,
  emailSchema,
  otpVerSchema,
} = require("./auth.validate.js");
const config = require("../../config/index.js");
const { verifyToken } = require("../../utils/tokenisation.js");
const User = require("./auth.model.js");
const jwt = require("jsonwebtoken");
const { allowedRoles } = require("../../config/constants.js");
//
//  0
router.post(
  "/register-as-bidder",
  validateRequest(registerSchema),
  authController.registerUser(allowedRoles.bidder)
);
//  1
router.post(
  "/register-as-seller",
  validateRequest(registerSchema),
  authController.registerUser(allowedRoles.seller)
);
//  2
router.post(
  "/verify-email",
  validateRequest(otpVerSchema),
  authController.verifyEmail
);
// 
router.post("/login", validateRequest(loginSchema), authController.login);
// 
router.post("/email-verification",validateRequest(emailSchema), authController.verifyAccount); // extra, depends on front end design 

// router.get("/logout", authController.logout);

router.post("/recovery", validateRequest(emailSchema), authController.recoverAccount);

router.get("/recovery/:token", authController.resetPw);

router.post("/reset-password", authController.updatePw);

//  needed time to make it more articulated ...
router.get("/cookie-check", async (req, res) => {
  try {
    const token = req.cookies[config.tkn_header_key];
    console.log(token);

    const verified = verifyToken({ token, secret: config.tkn_secret });

    const user = await User.findById(verified?.user_id);
    const { role, email, phone, fullName } = user;

    if (user.isVerified) {
      res.send({
        status: 200,
        success: true,
        message: "good ",
        data: {
          role,
          email,
          phone,
          fullName,
        },
      });
    } else {
      //  needed time to make it more articulated ...
      res.send({
        status: 400,
        success: false,
        message: "not valid",
      });
    }
  } catch (error) {
    res.send({
      status: 400,
      success: false,
      message: "not valid",
    });
  }
});

router.post("/test-auth-token", async (req, res) => {
  const { email, role, password } = req.body;
  try {
    let user = await User.findOne({ email, role, password });
    if (!user) {
      user = User.create({
        email,
        password,
        role,
        profile_id: "66f25cf57ed2cbf857beb03f",
      });
    }
    res.send(
      jwt.sign(
        { user_id: user.id, role: user.role, email },
        config.tkn_secret,
        config.jwt_options
      )
    );
  } catch (error) {
    res.send("error");
  }
});

module.exports = router;
