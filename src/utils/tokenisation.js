const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");

const createToken = ({ payload, expireTime }) => {
  try {
    return jwt.sign(payload, config.tkn_secret, {
      expiresIn: expireTime,
    });
  } catch (error) {
    console.error("Error creating token:", error.message);
    throw new Error("Token creation failed.");
  }
};

const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, config.tkn_secret);
    return { success: true, payload };
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return { success: false, payload: null };
  }
};

async function getHashedPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10); // 10 is the number of salt rounds
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error("Error generating hash from password", error.message);
    throw new Error("Error processing password");
  }
}

module.exports = { createToken, verifyToken, getHashedPassword };
