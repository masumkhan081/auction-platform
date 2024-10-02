const httpStatus = require("http-status");
const config = require("../config/index");

const { verifyToken } = require("../utils/tokenisation");
const ApiError = require("../utils/api.error");

//  accessRole can be undefined/empty string or "admin" or "salesman"
function accessControl(accessRole) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (token) {
        const isVerified = verifyToken({ token, secret: config.tkn_secret });
        console.log("isVerified: " + JSON.stringify(isVerified));
        if (!isVerified) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Invalid token");
        } else {
          // Assign custom properties to the req object
          req.user_id = isVerified?.user_id;
          req.role = isVerified?.role;
          console.log(req.role + "    <>   " + accessRole);
          if (!accessRole === req.role) {
            throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
          } else {
            next();
          }
        }
      } else {
        throw new ApiError(httpStatus.BAD_REQUEST, "Token not found");
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Forbidden !!",
        status: 500,
      });
    }
  };
}

module.exports = accessControl;
