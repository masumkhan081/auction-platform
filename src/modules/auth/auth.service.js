/* eslint-disable no-unused-vars */
const User = require("./auth.model");
const bcrypt = require("bcrypt");
const { sendOTPMail } = require("../../utils/mail");
const config = require("../../config");
const httpStatus = require("http-status");
/* eslint-disable no-unused-vars */
const { getSearchAndPagination } = require("../../utils/pagination");
const { operableEntities } = require("../../config/constants");
const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../../utils/responseHandler");
const crypto = require("crypto-js");
const { verifyToken, getHashedPassword } = require("../../utils/tokenisation");
const Profile = require("../profile/profile.model");

async function register({ res, data }) {
  let user;
  let profile;
  try {
    const { fullName, phone, gender, address, email, password, role } = data; // Ensure role is included
    profile = await new Profile({ fullName, phone, address, gender }).save();

    user = await new User({
      email,
      password,
      role,
      profileId: profile.id,
    }).save();

    sendOTPMail({
      user,
      res,
      successMessage: "An OTP has been sent to your email for verification.",
    });
  } catch (error) {
    if (profile) {
      await Profile.findByIdAndDelete(profile.id);
    }
    if (user) {
      await User.findByIdAndDelete(user.id);
    }
    console.log("err:: " + error.message);
    res.status(500).send({ message: "Error creating bidder profile" });
  }
}

async function verifyEmail({ data, res }) {
  try {
    // Decrypt OTP token and parse the data
    const { expireAt, otp, email } = JSON.parse(
      crypto.AES.decrypt(data.token, config.tkn_secret).toString(
        crypto.enc.Utf8
      )
    );

    console.log("User input: ", data.otp, data.email, data.token);
    console.log("Parsed from token: ", expireAt, otp, email);

    // Check if OTP has expired
    if (new Date().getTime() > expireAt) {
      return res.status(400).send({ success: false, message: "OTP expired" });
    }

    // Validate OTP and email
    if (data.otp === otp && data.email === email) {
      const user = await User.findOneAndUpdate({ email }, { isVerified: true });

      if (user) {
        return res.status(200).send({
          success: true,
          message: "Account verified. You may login",
        });
      } else {
        return res.status(404).send({
          success: false,
          message: "No user associated with that email",
        });
      }
    } else {
      return res
        .status(400)
        .send({ success: false, message: "Invalid OTP or email" });
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
}

async function login({ res, email, password }) {
  try {
    const user = await User.findOne({ email });
    let token;
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        if (user.isVerified) {
          token = jwt.sign(
            {
              user_id: user.id, // i should remove id from here !
              role: user.role,
              email: user.email,
              expire: 2628000000 + Date.now(),
            },
            config.tkn_secret,
            config.jwt_options
          );
          res.status(200).send({
            success: true,
            message: "You are successfully logged in",
            token,
          });
        }
        // email and associated password matched but email not-verified yet
        else {
          sendOTPMail({
            user,
            res,
            successMessage:
              "Email not verified yet. We sent an OTP to your email for verification.",
          });
        }
      } else {
        res.status(400).send({ success: false, message: "Wrong Credentials" });
      }
    }
    // no user with that username in system
    else {
      res.status(400).send({ success: false, message: "Wrong Credentials" });
    }
  } catch (error) {
    console.error("Inside service func:", error.message);
    res.status(500).send({ message: "Internal server error" });
  }
}

// async function logout(req, res) {
//   res.clearCookie(config.tkn_header_key);
//   res.status(200).send("Pulled Out Succesfully");
// }
//
async function verifyAccountRecovery({ res, token }) {
  try {
    const { id, expireAt, email } = verifyToken({
      token,
      secret: config.tkn_secret,
    });

    if (new Date().getTime() < expireAt) {
      res.status(400).send({
        success: false,
        message: "Password reset link expired.",
      });
    } else {
      const user = await User.findOne({ email: email });
      res.status(200).send({
        success: true,
        message: "Your can update your password now",
        data: { email: user.email },
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server error: processing reset link",
    });
  }
}

async function updatePassword({ email, password, confirmPassword, res }) {
  try {
    if (password === confirmPassword) {
      const hashedPassword = await getHashedPassword(password);

      await User.findOneAndUpdate({ email }, { password: hashedPassword });
      res.status(200).send({
        success: true,
        message: "Password updated successfully. You may login",
      });
    } else {
      res.status(400).send({
        success: false,
        message: "Password doesn't match",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
  // const result = await userService.updatePw(req.body);
}

module.exports = {
  register,
  login,
  verifyEmail,
  verifyAccountRecovery,
  updatePassword,
};
