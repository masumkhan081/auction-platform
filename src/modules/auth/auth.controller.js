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
      return res.status(409).send({
        success: false,
        message: "Email already registered. You may login",
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
    console.log("err in controller: " + error.message);
    res.status(500).send({ message: "Error processing request" });
  }
};

async function verifyEmail(req, res) {
  try {
    await authService.validateEmail({
      res,
      data: req.body,
    });
  } catch (error) {
    console.log("err in controller: " + error.message);
    res.status(500).send({ message: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    await authService.login({ res, data: req.body });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server error",
    });
  }
}

// async function logout(req, res) {
//   res.clearCookie(config.tkn_header_key);
//   res.send({ status: 200, message: "User logged out succesfully" });
// }

async function recoverAccount(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (user.isVerified) {
        sendResetMail({
          user,
          res,
          successMessage:
            "An OTP has been sent to your email for verification.",
        });
      } else {
        res.status(400).send({ message: "Your account is not verified yet" });
      }
    } else {
      res
        .status(400)
        .send({ message: "No account associated with that email" });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: "Interval server error" });
  }
}

async function resetPw(req, res) {
  try {
    await authService.resetPw({ token: req.params.token, res });
  } catch (error) {
    res.status(500).send({ success: false, message: "Interval server error" });
  }
}

async function updatePw(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;
    await authService.updatePw({ res, email, password, confirmPassword });
  } catch (error) {
    res.status(500).send({ success: false, message: "Interval server error" });
  }
}
async function verifyAccount(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user.isVerified) {
      res.status(200).send({ message: "Account already verified" });
    } else {
      sendOTPMail({
        user,
        res,
        successMessage: "An OTP has been sent to your email for verification.",
      });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: "Interval server error" });
  }
}

//
module.exports = {
  registerUser,
  login,
  logout,
  resetPw,
  updatePw,
  verifyAccount,
  recoverAccount,
  verifyEmail,
};
