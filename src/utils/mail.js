require("dotenv").config();
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const config = require("../config");
//
//  send otp to user email for email verification
const sendOTPMail = async (email) => {
  try {
    const generatedOTP = generateOTP();
    //
    const mailOptions = getMailOptions({
      to: email,
      subject: () => setSubject("verification"),
      html: () => getVerificationMessage(generatedOTP),
    });
    console.log("mailOptions: " + JSON.stringify(mailOptions));
    //
    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);

    const token = getOtpToken({ otp: generatedOTP, email });

    if (result.accepted.includes(email)) {
      return {
        success: true,
        token,
      };
    }
    return {
      success: false,
    };
  } catch (error) {
    console.log("err-msg: " + error.message);
    return { success: false, message: error.message };
  }
};

//  send password reset link to user email
async function sendResetMail(email) {
  //
  try {
    const mailOptions = getMailOptions({
      to: email,
      subject: () => setSubject("recovery"),
      html: () => getResetLink(email),
    });
    //
    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);
    //
    if (result.accepted.includes(email)) {
      return {
        success: true,
      };
    }
    return {
      success: false,
    };
    //
  } catch (error) {
    console.log("err: sendResetMail: " + error.message);
    return { success: false, message: error.message };
  }
}

const generateOTP = () => {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const getVerificationMessage = (otp) =>
  `<h4 style="color:blue;text-align:center;">Please copy or type the OTP provided below: <br><br>${otp}`;

function getResetLink(email) {
  return `<h4 style="color:blue;text-align:center;">Please click the link to reset your password: </h4><br><br>${
    config.baseUrl
  }/api/auth/recovery/${jwt.sign(
    {
      email: email,
      expireAt: new Date().getTime() + 5 * 60000,
    },
    config.tokenSecret
  )}`;
}

// return a relatable email sibject based on purpose of the mail
const setSubject = (action) =>
  action === "recovery"
    ? "Auction-platform: Recover Your Password"
    : action === "verification"
    ? "Auction-platform: Verify Your Email"
    : "";
//
const getMailOptions = ({ to, subject, html }) => {
  return {
    from: config.senderEmail,
    to,
    subject: subject(),
    html: html(),
  };
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: config.mailHost,
    port: 587,
    secure: false,
    auth: {
      user: config.senderEmail,
      pass: config.senderEmailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

//  create and return a encrypted token holding data: otp and expiration time for it
function getOtpToken({ otp, email, phone }) {
  let data = {
    otp,
    expireAt: new Date().getTime() + 5 * 60000,
  };

  if (email) {
    data.email = email;
  }
  if (phone) {
    data.phone = phone;
  }

  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    config.tokenSecret
  ).toString();
}

module.exports = {
  sendResetMail,
  sendOTPMail,
  generateOTP,
  getOtpToken,
};
