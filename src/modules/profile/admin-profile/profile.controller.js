const profileService = require("./profile.service");
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
async function createProfile(req, res) {
  const result = await profileService.createProfile(req.body);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendCreateResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function getProfiles(req, res) {
  const result = await profileService.getProfiles(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function updateProfile(req, res) {
  const result = await profileService.updateProfile({
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
async function deleteProfile(req, res) {
  const result = await profileService.deleteProfile(req.params.id);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendDeletionResponse({ res, data: result, what: operableEntities.address });
  }
}
//
module.exports = {
  createProfile,
  updateProfile,
  deleteProfile,
  getProfiles,
};
