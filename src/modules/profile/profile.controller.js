const profileService = require("./profile.service");
const bidService = require("../bids/bid.service");
const auctionService = require("../auction/auction.service");
const productService = require("../product/product.service");
//
const {
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  sendSingleFetchResponse,
} = require("../../utils/responseHandler");
const { entities, allowedRoles } = require("../../config/constants");
const { default: mongoose } = require("mongoose");
const bidService = require("../../modules/bids/bid.service");
//

async function getBidsByRole(req, res) {
  try {
    const { auction } = req.query;
    const { userId, role } = req;
    const appliedQuery = {};
    //
    if (auction) {
      appliedQuery.auction = auction;
    }
    switch (role) {
      case allowedRoles.seller:
        appliedQuery.auction.seller = userId;
        break;
      case allowedRoles.bidder:
        appliedQuery.bidder = userId;
        break;
    }
    //
    const result = await bidService.getBids(appliedQuery);
    sendFetchResponse({ res, data: result, what: entities.bid });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.bid,
    });
  }
}

async function getProfileDetail(req, res) {
  try {
    // Validate the user ID from the request
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }
    // Fetch profile details
    const result = await profileService.getProfileDetail(req.userId);

    // Successfully fetched profile details
    return sendSingleFetchResponse({
      res,
      data: result,
      what: entities.profile,
    });
  } catch (error) {
    console.error("err: getProfileDetail:", error.message);
    return serverError(res);
  }
}
//
async function updateProfile(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      console.log("invalid req.userId at updateProfile");
      return serverError(res);
    }
    const result = await profileService.updateProfile({
      id: req.userId,
      data: req.body,
    });

    sendUpdateResponse({ res, data: result, what: entities.profile });
  } catch (error) {
    console.log("controller : updateProfile: " + error.message);
    serverError(res);
  }
}
//
async function deleteProfile(req, res) {
  try {
    const result = await profileService.deactivateProfile({
      id: req.userId,
      role: req.role,
    });

    sendUpdateResponse({ res, data: result, what: entities.profile });
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
      return sendErrorResponse({
        res,
        error: result,
        what: entities.bidder,
      });
    }
    sendFetchResponse({ res, data: result, what: entities.bidder });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.bidder,
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
      return sendErrorResponse({
        res,
        error: result,
        what: entities.seller,
      });
    }
    sendFetchResponse({ res, data: result, what: entities.seller });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.seller,
    });
  }
}
//
async function getBidHistory(req, res) {
  try {
    const result = await bidService.getBids({ bidder: req.userId });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: entities.bid,
      });
    } else {
      sendFetchResponse({ res, data: result, what: entities.bid });
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    sendErrorResponse({
      res,
      error,
      what: entities.bid,
    });
  }
}
//
async function getProductList(req, res) {
  const result = await productService.getProducts({
    ...req.query,
    seller: req.userId,
  });
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: entities.product });
  } else {
    sendFetchResponse({ res, data: result, what: entities.product });
  }
}
//
async function getAuctionHistory(req, res) {
  const result = await auctionService.getAuctions({
    ...req.query,
    seller: req.userId,
  });
  if (result instanceof Error) {
    sendErrorResponse({ res, error: result, what: entities.auction });
  } else {
    sendFetchResponse({ res, data: result, what: entities.auction });
  }
}
//
const serverError = (res) =>
  res.status(500).json({
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
  getBidsByRole,
};
