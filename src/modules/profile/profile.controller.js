const profileService = require("./profile.service");
const httpStatus = require("http-status");
//
const {
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
//
async function getProfileDetail(req, res) {
  try {
    const result = await profileService.getProfileDetail(req.user_id);
    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.profile });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.profile });
    }
  } catch (error) {
    serverError(res);
  }
}
//
async function getAuctionHistory(req, res) {
  const result = await profileService.getSellers(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function getBidHistory(req, res) {
  try {
    const result = await bidService.getBids({ bidder: req.user_id });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.bid,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.bid });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.bid,
    });
  }
}
//
async function getProductList(req, res) {
  const result = await profileService.getSellers(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function getBidderList(req, res) {
  const result = await profileService.getSellers(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function getSellerList(req, res) {
  const result = await profileService.getSellers(req.query);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.address });
  }
}
//
async function updateProfile(req, res) {
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
async function deleteProfile(req, res) {
  const result = await profileService.deleteSeller(req.params.id);
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.address });
  } else {
    sendDeletionResponse({ res, data: result, what: operableEntities.address });
  }
}
//
const serverError = (res) =>
  res.status(500).send({
    success: false,
    message: "Server error",
  });

//
module.exports = {
  updateProfile,
  deleteProfile,
  getBidderList,
  getSellerList,
  getProfileDetail,
  getAuctionHistory,
  getProductList,
  getBidHistory,
};
