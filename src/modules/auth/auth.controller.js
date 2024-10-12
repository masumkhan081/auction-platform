const authService = require("./auth.service");
const httpStatus = require("http-status");
const config = require("../../config/index");
const User = require("./auth.model");
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
//
//
async function registerBidder(req, res) {
  try {

    const isExist = await User.findOne({ email: req.body.email });
    if (isExist) {
      return res.status(409).send({
        success: false,
        message: "Email already registered. You may login"
      });
    }
    else {
      req.body.password = await getHashedPassword(req.body.password);
      req.body.role = allowedRoles.bidder;
      await authService.register({
        res,
        data: req.body,
      });
    }

  } catch (error) {
    console.log("err in controller: " + error.message);
    res.status(500).send({ message: "Error processing request" });
  }
}

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
  try { 
      await authService.validateEmail({
        res,
        data: req.body,
      });
  } catch (error) {
    console.log("err in controller: " + error.message);
    res.status(500).send({ message: "Error processing request" });
  }
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
    const user = await User.findOne({ email: req.body.email });
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
  registerBidder,
};
