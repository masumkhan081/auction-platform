const authService = require("./auth.service");
const httpStatus = require("http-status");
const config = require("../../config/index");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  responseMap,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const { allowedRoles } = require("../../config/constants");
const { getHashedPassword } = require("../../utils/tokenisation");
const { sendOTPMail, sendResetMail } = require("../../utils/mail");
const User = require("./auth.model");
//
//
const registerUser = (role) => async (req, res) => {
  try {
    const isExist = await User.findOne({ email: req.body.email });
    if (isExist) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    } else {
      req.body.password = await getHashedPassword(req.body.password);
      req.body.role = role;
      await authService.register({
        res,
        data: req.body,
      });
    }
  } catch (error) {
    console.log("controller: registerUser: " + error.message);
    res.status(500).json({ success: false, message: "Error processing request" });
  }
};

async function requestEmailVerfication(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (user.isVerified) {
        res.status(200).json({ message: "Account already verified" });
      } else {
        sendOTPMail({
          user,
          res,
          successMessage:
            "An OTP has been sent to your email for verification.",
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "No user associated with that email",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Interval server error" });
  }
}

async function verifyEmail(req, res) {
  try {
    await authService.verifyEmail({
      res,
      data: req.body,
    });
  } catch (error) {
    console.log("err in controller: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    await authService.login({ res, email, password });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// async function logout(req, res) {
//   res.clearCookie(config.tokenHeaderKey);
//   res.json({ status: 200, message: "User logged out succesfully" });
// }

async function requestAccountRecovery(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (user.isVerified) {
        sendResetMail({
          user,
          res,
          successMessage: "A password reset link has been sent to your email.",
        });
      } else {
        res.status(400).json({ message: "Your account is not verified yet" });
      }
    } else {
      res
        .status(400)
        .json({ message: "No account associated with that email" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Interval server error" });
  }
}

async function verifyAccountRecovery(req, res) {
  try {
    await authService.verifyAccountRecovery({ token: req.params.token, res });
  } catch (error) {
    res.status(500).json({ success: false, message: "Interval server error" });
  }
}

async function updatePassword(req, res) {
  try {
    const { token, email, password, confirmPassword } = req.body;
    await authService.updatePassword({ res, token, email, password, confirmPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: "Interval server error" });
  }
}

//
module.exports = {
  registerUser,
  requestEmailVerfication,
  verifyEmail,
  login,
  requestAccountRecovery,
  verifyAccountRecovery,
  updatePassword,
};
