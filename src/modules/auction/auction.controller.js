const auctionService = require("./auction.service");
const Auction = require("./auction.model");
const {
  sendCreateResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  sendSingleFetchResponse,
} = require("../../utils/responseHandler");
const { entities, userRoles } = require("../../config/constants");
const { validateAndConvertToUTC } = require("./auction.validate");
const Product = require("../product/product.model");
const { default: mongoose } = require("mongoose");
const moment = require("moment-timezone");
//
async function getTestAuctionTime(req, res, next) {
  //
  const auctionStart = moment().tz("Asia/Dhaka").add(30, "seconds");
  const auctionEnd = moment().tz("Asia/Dhaka").add(60, "seconds");
  //
  res.json({
    timeZone: "Asia/Dhaka",
    auctionStart: auctionStart.toISOString(),
    auctionEnd: auctionEnd.toISOString(),
    startHour: auctionStart.hour(),
    startMinute: auctionStart.minute(),
    startSecond: auctionStart.second(),
    endMinute: auctionEnd.minute(),
    endSecond: auctionEnd.second(),
  });
}

//
async function createAuction(req, res) {
  try {
    const {
      product,
      auctionStart,
      auctionEnd,
      timeZone,
      threshold,
      startPrice,
      minBidIncrement,
    } = req.body;

    // Validate and convert dates
    const dateValidationResult = validateAndConvertToUTC({
      auctionStart,
      auctionEnd,
      timeZone,
    });

    if (!dateValidationResult.success) {
      return res
        .status(400)
        .json({ success: false, message: dateValidationResult.message });
    }

    // Check if product exists and is valid for auction
    const targetProduct = await Product.findById(product);
    if (!targetProduct)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    if (["SOLD", "ON_AUCTION", "PENDING"].includes(targetProduct.status))
      return res.status(400).json({
        success: false,
        message: `Product is already ${targetProduct.status} against an auction.`,
      });
    if (targetProduct.adminApproval !== "APPROVED")
      return res.status(400).json({
        success: false,
        message: `Product must be approved. Current status: ${targetProduct.adminApproval}.`,
      });

    // Validate threshold and bid increment constraints
    if (threshold > startPrice)
      return res.status(400).json({
        success: false,
        message: "Threshold cannot be higher than the starting price.",
      });

    if (minBidIncrement > threshold / 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum bid increment must not exceed 1/3 of threshold value",
      });
    }

    // All validations passed
    req.body.auctionStart = dateValidationResult.auctionStart;
    req.body.auctionEnd = dateValidationResult.auctionEnd;
    req.body.seller = req.userId;

    // Create auction
    const addResult = await auctionService.createAuction(req.body);
    sendCreateResponse({
      res,
      what: entities.auction,
      data: addResult,
    });
  } catch (error) {
    console.error("Controller: createAuction - Error:", error.message);
    sendErrorResponse({ res, error, what: entities.auction });
  }
}

//
async function getSingleAuction(req, res) {
  try {
    const targetAuctionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetAuctionId)) {
      return res.status(400).json({ message: "Invalid resource (auction) id" });
    }
    const result = await auctionService.getSingleAuction(targetAuctionId);
    sendSingleFetchResponse({
      res,
      data: result,
      what: entities.auction,
    });
  } catch (error) {
    console.error("Controller: getSingleAuction - Error:", error.message);
    sendErrorResponse({ res, error, what: entities.auction });
  }
}
//
async function updateAuction(req, res) {
  try {
    //
    const targetAuctionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetAuctionId)) {
      return res.status(400).json({ message: "Invalid resource (auction) id" });
    }
    //
    const targetAuction = await Auction.findById(targetAuctionId);
    if (!targetAuction) {
      return res.status(404).json({
        success: false,
        message: "Target auction no more exist.",
      });
    }
    //
    const invalidStatusChangeFromAndTo = ["SOLD", "OPEN", "UNSOLD"]; // no change allowed while status being any of these
    //
    if (invalidStatusChangeFromAndTo.includes(targetAuction.status)) {
      return res.status(404).json({
        success: false,
        message: `Can't bring change to ${targetAuction.status} auction.`,
      });
    }
    const statusChangeTo = req.body.status || targetAuction.status;

    // map of what status can be changed to which statuses; control of transition of status
    if (invalidStatusChangeFromAndTo.includes(statusChangeTo)) {
      return res.status(400).json({
        success: false,
        message: `Changing status from ${targetAuction.status} to ${data.status} is restricted for seller`,
      });
    }
    //
    const data = {
      product: req.body.product || targetAuction.product,
      auctionStart: req.body.auctionStart || targetAuction.auctionStart,
      auctionEnd: req.body.auctionEnd || targetAuction.auctionEnd,
      timeZone: req.body.timeZone || targetAuction.timeZone,
      threshold: req.body.threshold || targetAuction.threshold,
      startPrice: req.body.startPrice || targetAuction.startPrice,
      minBidIncrement:
        req.body.minBidIncrement || targetAuction.minBidIncrement,
      status: statusChangeTo,
    };

    //
    if (statusChangeTo === "PENDING") {
      const {
        success,
        message,
        auctionStart: convertedStart,
        auctionEnd: convertedEnd,
      } = validateAndConvertToUTC({
        auctionStart: data.auctionStart,
        auctionEnd: data.auctionEnd,
        timeZone: data.timeZone,
      });

      if (!success) {
        return res.status(400).json({ success, message });
      }
      data.auctionStart = convertedStart;
      data.auctionEnd = convertedEnd;
    }

    //
    const targetProduct = await Product.findById(data.product);
    //
    if (!targetProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (
      ["SOLD", "ON_AUCTION"].includes(targetProduct.status) ||
      (targetProduct.status === "PENDING" &&
        targetAuction.product !== data.product)
    ) {
      return res.status(400).json({
        success: false,
        message: `Target product is already ${targetProduct.status} against another auction.`,
      });
    }

    if (targetProduct.adminApproval !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `The product must be approved to set on auction. Current status: ${targetProduct.adminApproval}.`,
      });
    }

    if (data.threshold > data.startPrice) {
      return res.status(400).json({
        success: false,
        message: "Threshold can't be higher than starting price",
      });
    }

    if (data.minBidIncrement > data.threshold / 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum bid increment must be 1/3 of threshold value",
      });
    }

    const result = await auctionService.updateAuction({
      id: targetAuctionId,
      data,
    });

    // if result itself is an error
    if (result instanceof Error) {
      return sendErrorResponse({
        res,
        error: result,
        what: entities.auction,
      });
    }

    // Success case
    sendUpdateResponse({
      res,
      data: result,
      what: entities.auction,
    });
  } catch (error) {
    console.error("Controller: updateAuction - Error:", error.message);
    sendErrorResponse({ res, error, what: entities.auction });
  }
}
//
async function getAuctions(req, res) {
  try {
    const result = await auctionService.getAuctions(req.query);
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: entities.auction,
      });
    } else {
      sendFetchResponse({ res, data: result, what: entities.auction });
    }
  } catch (error) {
    console.error("Controller: getAuctions - Error:", error.message);
    sendErrorResponse({
      res,
      error,
      what: entities.auction,
    });
  }
}
//
async function deleteAuction(req, res) {
  try {
    const targetAuctionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetAuctionId)) {
      return res.status(400).json({ message: "Invalid resource (auction) id" });
    }

    const targetAuction = await Auction.findById(targetAuctionId);
    if (!targetAuction) {
      return res.status(404).json({
        success: false,
        message: "Target auction doesn't exist.",
      });
    }
    const roleStatusMaps = {
      [userRoles.admin]: {
        totalDelete: ["OPEN", "PENDING", "CANCELLED"],
        deleteButKeep: ["UNSOLD", "SOLD"], // business logic dependent
      },
      [userRoles.seller]: {
        totalDelete: ["PENDING", "CANCELLED"],
        deleteButKeep: [],
      },
    };

    const auctionStatus = targetAuction.status;

    const isAdmin = req.role === userRoles.admin;
    const isSeller = req.role === userRoles.seller;

    // Check if the auction should be permanently deleted
    if (
      (isAdmin &&
        roleStatusMaps[userRoles.admin].totalDelete.includes(auctionStatus)) ||
      (isSeller &&
        roleStatusMaps[userRoles.seller].totalDelete.includes(auctionStatus))
    ) {
      await Auction.findByIdAndDelete(targetAuctionId);
      return res.status(200).json({
        success: true,
        message: "Auction deleted permanently.",
      });
    }

    // Check if the auction should be marked as deleted but record kept
    if (
      (isAdmin &&
        roleStatusMaps[userRoles.admin].deleteButKeep.includes(
          auctionStatus
        )) ||
      (isSeller &&
        roleStatusMaps[userRoles.seller].deleteButKeep.includes(auctionStatus))
    ) {
      await Auction.findByIdAndUpdate(
        targetAuctionId,
        { isDeleted: true },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Auction deleted successfully.",
      });
    }
    //
  } catch (error) {
    console.error("Controller: deleteAuction - Error:", error.message);
    sendErrorResponse({
      res,
      error,
      what: entities.auction,
    });
  }
}
//
async function getAuctionHistory(req, res) {
  try {
    const result = await auctionService.getAuctions({
      ...req.query,
      seller: req.userId,
    });
    sendFetchResponse({ res, data: result, what: entities.auction });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.bid,
    });
  }
}
//
module.exports = {
  createAuction,
  updateAuction,
  deleteAuction,
  getAuctions,
  getSingleAuction,
  getTestAuctionTime,
  getAuctionHistory,
};
