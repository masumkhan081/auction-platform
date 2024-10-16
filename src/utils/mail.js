require("dotenv").config();
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const config = require("../config");

//  send otp to user email for email verification
const sendOTPMail = ({ user, res, successMessage }) => {
  try {
    const generatedOTP = generateOTP();
    //
    const mailOptions = getMailOptions({
      to: user.email,
      subject: () => setSubject("verification"),
      html: () => getVerificationMessage(generatedOTP),
    });
    //
    const transporter = getTransporter();
    transporter
      .sendMail(mailOptions)
      .then((result) => {
        result.accepted.includes(user.email)
          ? res.status(200).send({
              message: successMessage,
              token: getOtpToken({ otp: generatedOTP, email: user.email }),
            })
          : res.status(400).send({ message: "Error sending otp to the mail" });
      })
      .catch((err) => {
        console.log("err: sending mail  " + err.message);
        res.status(500).send({ message: "Error sending otp to the mail" });
      });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

//  send password reset link to user email
async function sendResetMail({ user, res, successMessage }) {
  //
  try {
    const mailOptions = getMailOptions({
      to: user.email,
      subject: () => setSubject("recovery"),
      html: () => getResetLink(user),
    });
    //
    const transporter = getTransporter();
    //
    transporter
      .sendMail(mailOptions)
      .then((result) => {
        result
          ? res.status(200).send({ message: successMessage })
          : res
              .status(400)
              .send({ message: "Error sending password reset mail" });
      })
      .catch((err) => {
        console.log("err: sending mail  " + err.message);
        res.status(500).send({ message: "Error sending password reset mail" });
      });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
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

function getResetLink(user) {
  return `<h4 style="color:blue;text-align:center;">Please click the link to reset your password: </h4><br><br>${
    config.baseUrl
  }/auth/recovery/${jwt.sign(
    {
      id: user.id,
      email: user.email,
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

const getMailOptions = ({ to, subject, html }) => {
  return {
    from: process.env.SENDER,
    to,
    subject: subject(),
    html: html(),
  };
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: config.mailHost,
    port: 465,
    secure: true,
    auth: {
      user: config.hostEmail,
      pass: config.hostEmailPassword,
    },
    tls: {
      rejectUnAuthorized: true,
    },
  });

//  create and return a encrypted token holding data: otp and expiration time for it
const getOtpToken = ({ otp, email }) =>
  CryptoJS.AES.encrypt(
    JSON.stringify({
      email,
      otp,
      expireAt: new Date().getTime() + 5 * 60000,
    }),
    config.tokenSecret
  ).toString();

module.exports = {
  sendResetMail,
  sendOTPMail,
};
