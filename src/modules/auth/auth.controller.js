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
const { entities } = require("../../config/constants");
const { userRoles } = require("../../config/constants");
const { getHashedPassword, verifyToken } = require("../../utils/tokenisation");
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
    res
      .status(500)
      .json({ success: false, message: "Error processing request" });
  }
};

//   resend - otp
async function requestEmailVerfication(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user associated with that email",
      });
    }
    if (user.isVerified) {
      return res.status(200).json({ message: "Account already verified" });
    }
    const { success, token } = await sendOTPMail(email);

    return res.status(success ? 200 : 400).json({
      success,
      message: success
        ? "An OTP has been sent to your email for verification"
        : "Failed to send otp",
      token,
    });
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

    if (!user) {
      return res
        .status(400)
        .json({ message: "No account associated with that email." });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Your account is not verified yet." });
    }
    const { success } = await sendResetMail(user.email);

    if (success) {
      return res.status(200).json({
        success,
        message: "A password reset link has been sent to your mail",
      });
    }
    return res.status(400).json({
      success,
      message: "Failed to send reset link. Please try again.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Interval server error" });
  }
}

async function verifyAccountRecovery(req, res) {
  try {
    const { token } = req.params;
    const { success, payload } = verifyToken(token);

    if (!success) {
      return res.status(401).json({
        success: false,
        message: "The provided token is invalid or has changed.",
      });
    }

    const { expireAt, email } = payload;

    // Check if the token has expired
    if (new Date().getTime() >= expireAt) {
      return res.status(400).json({
        success: false,
        message: "Password reset link expired.",
      });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    console.log("payload:  " + JSON.stringify(user));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // If everything is valid, allow password update, would expect the token at update password post req
    return res.status(200).json({
      success: true,
      message: "You can update your password now.",
      token,
    });
  } catch (error) {
    console.log("err: verifyRecoveryToken: " + error.message);
    res.status(500).json({ success: false, message: "Interval server error" });
  }
}

async function updatePassword(req, res) {
  try {
    const { token, email, password, confirmPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user associated with that email",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "password &  confirm password doesn't match",
      });
    }

    const { success, payload } = verifyToken(token);
    const { expireAt, email: emailFromToken } = payload;

    if (!success || email !== emailFromToken) {
      return res.status(401).json({
        success: false,
        message: "The provided token is invalid or has changed.",
      });
    }

    // Check if the token has expired
    if (new Date().getTime() >= expireAt) {
      return res.status(400).json({
        success: false,
        message: "Password reset link expired.",
      });
    }

    const hashedPassword = await getHashedPassword(password);

    const result = await authService.updatePassword({
      email,
      password: hashedPassword,
    });
    if (result instanceof Error) {
      return res.status(400).json({
        success: false,
        message: "Failed to update password",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You may log in.",
    });
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
