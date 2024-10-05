const httpStatus = require("http-status");
//
//
function sendFetchResponse({ res, data, what }) {
  let statusCode = responseMap.fetch.code;
  res.status(statusCode).send({
    statusCode,
    success: true,
    message: responseMap.fetch.message(what),
    data,
  });
}

function sendCreateResponse({ res, data, what }) {
  let statusCode = responseMap.create.code;
  res.status(statusCode).send({
    statusCode,
    success: true,
    message: responseMap.create.message(what),
    data,
  });
}

function sendUpdateResponse({ res, data, what }) {
  let statusCode = data === null ? 404 : 200;
  res.status(statusCode).send({
    statusCode,
    success: data !== null,
    message: data === null ? err_msg.id_not_found : success_msg.update(what),
    data,
  });
}

function sendDeletionResponse({ res, data, what }) {
  let statusCode = data === null ? 404 : 200;
  res.status(statusCode).send({
    statusCode: statusCode,
    success: data !== null,
    message: data === null ? err_msg.id_not_found : success_msg.delete(what),
    data,
  });
}

function sendErrorResponse({ res, error, what }) {
  let statusCode;
  let message;
  let messages = {};
  let type;
  //
  console.log("error:  " + JSON.stringify(error));
  //  in case of errors based on mongoose schema fields
  if (error?.name == "ValidationError") {
    let errors = error.errors;
    let keys = Object.keys(errors);
    message = "Invalid data";
    for (let i = 0; i < keys.length; i++) {
      messages[keys[i]] = errors[keys[i]].message;
    }
    statusCode = 400;
    type = "mongoose-error";
  }
  // Duplicate key error code from mongoose
  else if (error?.code === 11000) {
    statusCode = responseMap.already_exist.code;
    message = responseMap.already_exist.message(what); // already exist message relating with the entity
  } else if (error?.code === responseMap.already_used.code) {
    statusCode = error.code;
    message = error.message(what); // already used message relating with the entity
  }
  // all the other cases
  else {
    statusCode = responseMap.server_error.code;
    message = responseMap.server_error.message;
  }
  res.status(statusCode).send({
    statusCode,
    success: false,
    message,
    messages,
    type,
  });
}

const responseMap = {
  create: {
    code: 201,
    message: (what) => `${what}  created successfully`,
  },
  delete: { code: 200, message: (what) => `${what} deleted successfully` },
  update: { code: 200, message: (what) => `${what} updated successfully` },
  fetch: { code: 200, message: (what) => `${what} fetched successfully` },
  //
  creation_failed: { code: 1000, message: "Creation failed" },
  id_not_found: {
    status: 404,
    message: "ID not found. Update operation failed.",
  },
  invalid: { code: 1000, message: "Invalid Request" },
  bad_req: { code: 1000, message: "Bad Request" },
  not_found: { code: 1000, message: (what) => `${what} not found` },
  server_error: { code: 500, message: "Internal Server Error" },
  something_went_wrong: { code: 1000, message: "Something went wrong" },
  unauthorized: { code: 1000, message: "Unauthorized Access" },
  forbidden: { code: 1000, message: "Forbidden Access" },

  no_data: { code: 404, message: `No Data` },
  fail_in_update: { code: 1000, message: (what) => `${what} failed to update` },
  //
  already_exist: {
    code: 409, // Error code for "Already Exists" as mongodb return
    message: (what) => `${what} already exists`,
  },
  already_used: {
    code: 409, // HTTP status code for "Conflict"
    message: (what) =>
      `Cannot delete ${what}: Resource is already used by other entities`,
  },
};

module.exports = {
  sendFetchResponse,
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendUpdateResponse,
  responseMap,
};
