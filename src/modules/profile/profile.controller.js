const profileService = require("./seller.service");
const httpStatus = require("http-status");
//
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
//
async function createSeller(req, res) {
  const result = await profileService.createSeller(req.body);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendCreateResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function getSellers(req, res) {
  const result = await profileService.getSellers(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function updateSeller(req, res) {
  const result = await profileService.updateSeller({
    id: req.params.id,
    data: req.body,
  });
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendUpdateResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function deleteSeller(req, res) {
  const result = await profileService.deleteSeller(req.params.id);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendDeletionResponse({ res, data: result, what: operableEntities.address });
  }
}
//
module.exports = {
  createSeller,
  updateSeller,
  deleteSeller,
  getSellers,
};
