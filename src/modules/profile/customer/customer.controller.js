const customerService = require("./customer.service");
const httpStatus = require("http-status");
//
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
} = require("../../../utils/responseHandler");
const { operableEntities } = require("../../../config/constants");
//
async function createCustomer(req, res) {
  const result = await customerService.createCustomer(req.body);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.customer });
  } else {
    sendCreateResponse({ res, data: result, what: operableEntities.customer });
  }
}

async function getCustomers(req, res) {
  const result = await customerService.getCustomers(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.customer });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.customer });
  }
}
//
async function updateCustomer(req, res) {
  const result = await customerService.updateCustomer({
    id: req.params.id,
    data: req.body,
  });
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.customer });
  } else {
    sendUpdateResponse({ res, data: result, what: operableEntities.customer });
  }
}
//
async function deleteCustomer(req, res) {
  const result = await customerService.deleteAddress(req.params.id);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.customer });
  } else {
    sendDeletionResponse({
      res,
      data: result,
      what: operableEntities.customer,
    });
  }
}
//
module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
};
