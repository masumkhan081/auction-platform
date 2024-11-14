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
const { entities, userRoles } = require("../../config/constants");
const { default: mongoose } = require("mongoose");
//

async function getProfileDetail(req, res) {
  try {
    const { userId } = req;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }
    // Fetch profile details
    const result = await profileService.getProfileDetail(userId);

    // Successfully fetched profile details
    return sendSingleFetchResponse({
      res,
      data: result,
      what: entities.profile,
    });
  } catch (error) {
    console.error("err: getProfileDetail:", error.message);
    sendErrorResponse({
      res,
      error,
      what: entities.profile,
    });
  }
}
//
async function updateProfile(req, res) {
  try {
    const { userId } = req;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }
    const result = await profileService.updateProfile({
      id: userId,
      data: req.body,
    });

    sendUpdateResponse({ res, data: result, what: entities.profile });
  } catch (error) {
    console.log("controller : updateProfile: " + error.message);
    sendErrorResponse({
      res,
      error,
      what: entities.profile,
    });
  }
}
//
async function deleteProfile(req, res) {
  try {
    const { userId, role } = req;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }

    const result = await profileService.deactivateProfile({
      id: userId,
      role: role,
    });

    sendUpdateResponse({ res, data: result, what: entities.profile });
  } catch (error) {
    console.log("controller : deleteProfile: " + error.message);
    sendErrorResponse({
      res,
      error,
      what: entities.profile,
    });
  }
}
//
async function getBidderList(req, res) {
  try {
    const result = await profileService.getList({
      ...req.query,
      role: userRoles.bidder,
    });

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
      role: userRoles.seller,
    });

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
module.exports = {
  updateProfile,
  deleteProfile,
  getBidderList,
  getSellerList,
  getProfileDetail, 
};
