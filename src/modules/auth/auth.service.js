/* eslint-disable no-unused-vars */
const User = require("./auth.model");
const bcrypt = require("bcrypt");
const { sendOTPMail } = require("../../utils/mail");
const config = require("../../config");
const httpStatus = require("http-status");
/* eslint-disable no-unused-vars */
const { getSearchAndPagination } = require("../../utils/pagination");
const { entities } = require("../../config/constants");
const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../../utils/responseHandler");
const crypto = require("crypto-js");
const { verifyToken, getHashedPassword } = require("../../utils/tokenisation");
const Profile = require("../profile/profile.model");
//
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
      profile: profile.id,
    }).save();

    const { success, token } = await sendOTPMail(user.email);

    if (success) {
      res.status(200).json({
        success,
        message: "An OTP has been sent to your email for verification",
        token,
      });
    } else {
      if (profile) {
        await Profile.findByIdAndDelete(profile.id);
      }
      if (user) {
        await User.findByIdAndDelete(user.id);
      }
    }
  } catch (error) {
    if (profile) {
      await Profile.findByIdAndDelete(profile.id);
    }
    if (user) {
      await User.findByIdAndDelete(user.id);
    }
    console.log("err: register: " + error.message);
    res.status(500).json({ message: "Error creating bidder profile" });
  }
}

async function verifyEmail({ data, res }) {
  try {
    // Decrypt OTP token and parse the data
    const { expireAt, otp, email } = JSON.parse(
      crypto.AES.decrypt(data.token, config.tokenSecret).toString(
        crypto.enc.Utf8
      )
    );

    console.log("User input: ", data.otp, data.email, data.token);
    console.log("Parsed from token: ", expireAt, otp, email);

    // Check if OTP has expired
    if (new Date().getTime() > expireAt) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Validate OTP and email
    if (data.otp === otp && data.email === email) {
      const user = await User.findOneAndUpdate({ email }, { isVerified: true });

      if (user) {
        return res.status(200).json({
          success: true,
          message: "Account verified. You may login",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "No user associated with that email",
        });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or email" });
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
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
              userId: user.id, // i should remove id from here !
              role: user.role,
              email: user.email,
              expire: 2628000000 + Date.now(),
            },
            config.tokenSecret,
            config.jwtOptions
          );
          //
          user.isActive = true; // if previously deleted own profile
          await user.save();
          //
          res.status(200).json({
            success: true,
            message: "You are successfully logged in",
            token,
          });
        }
        // email and associated password matched but email not-verified yet
        else {
          const { success, token } = await sendOTPMail(user.email);
          return res.status(success ? 200 : 400).json({
            success,
            message: success
              ? "Your account is not yet verified. We sent an otp to your mail."
              : "Your account is not veried yet",
            token,
          });
        }
      } else {
        res.status(400).json({ success: false, message: "Wrong Credentials" });
      }
    }
    // no user with that username in system
    else {
      res.status(400).json({ success: false, message: "Wrong Credentials" });
    }
  } catch (error) {
    console.error("Inside service func:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

// async function logout(req, res) {
//   res.clearCookie(config.tokenHeaderKey);
//   res.status(200).json("Pulled Out Succesfully");
// }
//

async function updatePassword({ email, password }) {
  try {
    const result = await User.findOneAndUpdate(
      { email },
      { password },
      { new: true } // Return the updated document
    );
    return result;
  } catch (error) {
    return error;
  }
}

module.exports = {
  register,
  login,
  verifyEmail,
  updatePassword,
};
