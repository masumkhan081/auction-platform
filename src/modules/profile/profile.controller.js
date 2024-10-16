const profileService = require("./profile.service");
const bidService = require("../bids/bid.service");
const auctionService = require("../auction/auction.service");
const productService = require("../product/product.service");
const httpStatus = require("http-status");
//
const {
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  sendSingleFetchResponse,
} = require("../../utils/responseHandler");
const { operableEntities, allowedRoles } = require("../../config/constants");
const { default: mongoose } = require("mongoose");
//
async function getProfileDetail(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user_id)) {
      return serverError(res);
    }
    const result = await profileService.getProfileDetail(req.user_id);
    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.profile });
    } else {
      sendSingleFetchResponse({
        res,
        data: result,
        what: operableEntities.profile,
      });
    }
  } catch (error) {
    serverError(res);
  }
}
//
async function updateProfile(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user_id)) {
      console.log("invalid req.user_id at updateProfile");
      return serverError(res);
    }
    const result = await profileService.updateProfile({
      id: req.user_id,
      data: req.body,
    });
    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.profile });
    } else {
      sendUpdateResponse({ res, data: result, what: operableEntities.profile });
    }
  } catch (error) {
    console.log("controller : updateProfile: " + error.message);
    serverError(res);
  }
}
//
async function deleteProfile(req, res) {
  try {
    const result = await profileService.deactivateProfile({
      id: req.user_id,
      role: req.role,
    });

    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.profile });
    } else {
      sendUpdateResponse({ res, data: result, what: operableEntities.profile });
    }
  } catch (error) {
    console.log("controller : deleteProfile: " + error.message);
    serverError(res);
  }
}
//
async function getBidderList(req, res) {
  try {
    const result = await profileService.getList({
      ...req.query,
      role: allowedRoles.bidder,
    });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.bidder,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.bidder });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.bidder,
    });
  }
}
//
async function getSellerList(req, res) {
  try {
    const result = await profileService.getList({
      ...req.query,
      role: allowedRoles.seller,
    });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.seller,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.seller });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.seller,
    });
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
    logger.error(`Error: ${error.message}`);
    sendErrorResponse({
      res,
      error,
      what: operableEntities.bid,
    });
  }
}
//
async function getProductList(req, res) {
  const result = await productService.getProducts({
    ...req.query,
    seller: req.user_id,
  });
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.product });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.product });
  }
}
//
async function getAuctionHistory(req, res) {
  const result = await auctionService.getAuctions({
    ...req.query,
    seller: req.user_id,
  });
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: operableEntities.auction });
  } else {
    sendFetchResponse({ res, data: result, what: operableEntities.auction });
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
