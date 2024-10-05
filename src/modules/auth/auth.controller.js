const authService = require("./auth.service");
const httpStatus = require("http-status");
const config = require("../../config/index");
const userModel = require("./auth.model");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  sendAuthResponse,
  success_msg,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const { isPostBodyValid } = require("./auth.validate");
const { getHashedPassword } = require("../../utils/tokenisation");
//
async function registerUser(req, res) {
  try {
    let hashedPassword;
    let data = isPostBodyValid(req.body);
    if (data.success) {
      hashedPassword = await getHashedPassword(data.password);
      data.password = hashedPassword;
      await authService.register({ res, data });
    } else {
      res.status(400).send({ message: data.message });
    }
  } catch (error) {
    res.status(400).send({ message: "Error processing request" });
  }
}

async function validateEmail(req, res) {
  const { email, otp, token } = req.body;
  await authService.validateEmail({
    res,
    user_email: email,
    user_otp: otp,
    token,
  });
}

async function login(req, res) {
  try {
    await authService.login({ res, data: req.body });
  } catch (error) {
    res.status(500).send({
      success: false,
      statusCode: 500,
      message: "Server error",
    });
  }
}

async function logout(req, res) {
  res.clearCookie(config.tkn_header_key);
  res.send({ status: 200, message: "User logged out succesfully" });
}

async function sendResetMail(req, res) {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    await authService.sendResetMail({
      res,
      user,
    });
  } catch (error) {
    res.send({
      status: 400,
      success: false,
      message: "internal server error",
    });
  }
}

async function resetPw(req, res) {
  await authService.resetPw({ token: req.params.token, res });
}

async function updatePw(req, res) {
  const { email, password, confirmPassword } = req.body;
  await authService.updatePw({ res, email, password, confirmPassword });
}
async function sendOTPToEmail(req, res) {
  const { email } = req.body;

  await authService.sendOTPToEmail(email);
}

//
module.exports = {
  registerUser,
  login,
  logout,
  resetPw,
  updatePw,
  sendOTPToEmail,
  sendResetMail,
  validateEmail,
};
