const httpStatus = require("http-status");
const config = require("../config/index");
const { verifyToken } = require("../utils/tokenisation");

//  accessRole can be undefined/empty string or "admin" or "salesman"
function accessControl(accessRoles) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (token) {
        const isVerified = verifyToken({ token, secret: config.tkn_secret });
        console.log("isVerified: " + JSON.stringify(isVerified));
        if (!isVerified) {
          forbid(res);
        } else {
          // Assign user id & role to later use if in case ...
          req.user_id = isVerified?.user_id;
          req.role = isVerified?.role;
          console.log(req.role + "    <>   " + accessRoles);
          if (accessRoles.includes(req.role)) {
            next();
          } else {
            forbid(res);
          }
        }
      } else {
        forbid(res);
      }
    } catch (error) {
      forbid(res);
    }
  };
}

const forbid = (res) =>
  res.status(403).send({
    success: false,
    message: "Access Forbidden !",
  });

module.exports = accessControl;
