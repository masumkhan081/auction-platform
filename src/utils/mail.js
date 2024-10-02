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
    const to = user.email;
    const subject = setSubject("verification");
    const html = getVerificationMessage(generatedOTP);

    const mailOptions = {
      to,
      subject,
      html,
    };
    const transporter = getTransporter();
    transporter
      .sendMail(mailOptions)
      .then((result) => {
        result.accepted.includes(user.email)
          ? res.status(201).send({
              message: successMessage,
              token: getOtpToken({ otp: generatedOTP, email: user.email }),
            })
          : res.status(400).send({ message: "Error sendign otp to the mail" });
      })
      .catch((err) => {
        console.log("err:  ---- " + err);
        res.send(err.message);
      });
  } catch (error) {
    res.status(400).send({ message: "Errro sending otp mail" });
  }
};

//  send password reset link to user email
async function sendResetMail({ user, res }) {
  //
  const to = user.email;
  const subject = setSubject("recovery");
  const html = getResetLink(user);
  //
  const mailOptions = {
    to,
    subject,
    html,
  };
  const transporter = getTransporter();
  //
  transporter
    .sendMail(mailOptions)
    .then((result) => {
      result
        ? res.status(200).send({ message: "A recovery mail has been sent " })
        : res
            .status(400)
            .send({ message: "Error sendign password reset mail" });
    })
    .catch((err) => {
      console.log("reset-mail: err:  " + err);
      res.send(err.message);
    });
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
    config.base_url
  }/auth/recovery/${jwt.sign(
    {
      id: user.id,
      email: user.email,
      expireAt: new Date().getTime() + 5 * 60000,
    },
    config.tkn_secret
  )}`;
}

// return a relatable email sibject based on purpose of the mail
const setSubject = (action) =>
  action === "recovery"
    ? "Auth-Full: Recover Your Password"
    : action === "verification"
    ? "Auth-Full: Verify Your Email"
    : "";

const getMailOptions = ({ to, subject, html }) => {
  return {
    from: config.sender_mail,
    to,
    subject: "subject()",
    html: "html()",
  };
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: config.mail_host,
    host: "smtp.gmail.com",
    port: 465,
    secure: false,
    auth: {
      user: config.host_email,
      pass: config.host_mail_password,
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
    config.tkn_secret
  ).toString();

module.exports = {
  sendResetMail,
  sendOTPMail,
};
