const httpStatus = require("http-status");
//
//
function sendSingleFetchResponse({ res, data, what }) {
  let statusCode = data ? responseMap.fetch.code : responseMap.notFound.code;
  res.status(statusCode).json({
    statusCode,
    success: data ? true : false,
    message: data
      ? responseMap.fetch.message(what)
      : responseMap.idNotFound.message(what),
    data,
  });
}
//
function sendFetchResponse({ res, data, what }) {
  if (data instanceof Error) {
    return sendErrorResponse({
      res,
      error: result,
      what,
    });
  }
  let statusCode = responseMap.fetch.code;
  res.status(statusCode).json({
    statusCode,
    success: true,
    message: responseMap.fetch.message(what),
    data,
  });
}

function sendCreateResponse({ res, data, what }) {
  let statusCode = responseMap.create.code;
  res.status(statusCode).json({
    statusCode,
    success: true,
    message: responseMap.create.message(what),
    data,
  });
}

function sendUpdateResponse({ res, data, what }) {
  const { update, notFound, idNotFound } = responseMap;
  const isSuccess = Boolean(data);
  const statusCode = isSuccess ? update.code : notFound.code;

  res.status(statusCode).json({
    statusCode,
    success: isSuccess,
    message: isSuccess ? update.message(what) : idNotFound.message(what),
    data,
  });
}

function sendDeletionResponse({ res, data, what }) {
  let statusCode = data ? responseMap.delete.code : responseMap.notFound.code;
  res.status(statusCode).json({
    statusCode,
    success: data ? true : false,
    message: data
      ? responseMap.delete.message(what)
      : responseMap.idNotFound.message(what),
    data,
  });
}

function sendErrorResponse({ res, error, what }) {
  let statusCode = 500; // Default to server error
  let message = "An unexpected error occurred";
  let messages = {};
  let type = "unknown-error";

  console.log("\nsendErrorResponse: ", error.message + "\n");

  // Handle Mongoose validation errors
  if (error?.name === "ValidationError") {
    message = "Invalid data";
    type = "mongoose-error";
    statusCode = 400;
    for (let [field, errorDetail] of Object.entries(error.errors)) {
      messages[field] = errorDetail.message;
    }
  }
  // Handle duplicate key errors
  else if (error?.code === 11000) {
    statusCode = responseMap.alreadyExist.code || 409;
    message = responseMap.alreadyExist.message(what);
    type = "duplicate-key-error";
  }
  // Handle specific error codes (e.g., 404, 409)
  else if (error?.code === 404 || error?.code === 409) {
    statusCode = error.code;
    message = error.message(what);
    type = "custom-error";
  }
  // Handle generic server errors
  else {
    statusCode = responseMap.serverError?.code || 500;
    message = responseMap.serverError?.message || "Server Error";
    type = "server-error";
  }

  // Send the error response
  res.status(statusCode).json({
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

  idNotFound: {
    code: 404,
    message: (what) => `No resource (${what}) with this ID.`,
  },
  alreadyExist: {
    code: 409, // Error code for "conflict" or "Already Exists" as mongodb return
    message: (what) => `Resource (${what}) already exists`,
  },
  alreadyUsed: {
    code: 409, // HTTP status code for "Conflict"
    message: (what) =>
      `Cannot delete ${what}: Resource is already used by other entities`,
  },
  //
  invalid: { code: 500, message: "Invalid Request" },
  badRequest: { code: 500, message: "Bad Request" },
  notFound: { code: 404, message: (what) => `${what} not found` },
  serverError: { code: 500, message: "Internal Server Error" },
  somethingWentWrong: { code: 500, message: "Something went wrong" },
  unauthorized: { code: 500, message: "Unauthorized Access" },
  forbidden: { code: 500, message: "Forbidden Access" },

  noData: { code: 204, message: `No Data` },
  failInUpdate: { code: 1000, message: (what) => `${what} failed to update` },
  //

  creationFailed: { code: 400, message: "Creation failed" },
};

module.exports = {
  sendFetchResponse,
  sendSingleFetchResponse,
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendUpdateResponse,
  responseMap,
};
