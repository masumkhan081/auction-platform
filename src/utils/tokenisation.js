const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const createToken = ({ payload, secret, expireTime }) =>
  jwt.sign(payload, secret, {
    expiresIn: expireTime,
  });

const verifyToken = ({ token, secret }) => jwt.verify(token, secret);

async function getHashedPassword(password) {
  const salt = await bcrypt.genSalt(10); // 10 is the number of salt rounds
  // Hash the password with the salt
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

module.exports = { createToken, verifyToken, getHashedPassword };
