var http = require("http");
var util = require("util");
const multer = require("multer");
const upload = multer();

const validateRequest = (requestBodySchema) => async (req, res, next) => {
  try {
    const valid = requestBodySchema.safeParse(req.body);
    if (valid.success) {
      console.log("valid::    ");
      next();
    } else {
      JSON.stringify(valid)
      console.log("invalid:  ");
      let messages = {};
      let issues = valid.error.issues;
      let issueKey;
      //
      for (let i = 0; i < issues.length; i++) {
        issueKey = issues[i].path[0];
        if (messages[issueKey]) {
          messages[issueKey].push(issues[i].message);
        } else {
          messages[issueKey] = [issues[i].message];
        }
      }
      //
      res.status(400).send({
        statusCode: 400,
        success: false,
        message: "Invalid data",
        messages,
        type: "ZodError",
      });
    }
  } catch (error) {
    console.log(error.message)
    res.status(400).send({
      success: false,
      message: "Invalid data",
      status: 400,
    });
  }
};

module.exports = validateRequest;
