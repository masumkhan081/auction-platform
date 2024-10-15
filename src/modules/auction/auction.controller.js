const auctionService = require("./auction.service");
const httpStatus = require("http-status");
const Auction = require("./auction.model");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  responseMap,
  sendSingleFetchResponse,
} = require("../../utils/responseHandler");
const { operableEntities, allowedRoles } = require("../../config/constants");
const { validateAndConvertToUTC } = require("./auction.validate");
const Product = require("../product/product.model");

//
async function createAuction(req, res) {
  try {
    //
    const {
      product,
      auctionStart,
      auctionEnd,
      timeZone,
      threshold,
      startPrice,
      minBidIncrement,
    } = req.body;
    //
    const {
      success,
      message,
      auctionStart: convertedStart,
      auctionEnd: convertedEnd,
    } = validateAndConvertToUTC({ auctionStart, auctionEnd, timeZone });
    //
    const targetProduct = await Product.findById(product);
    //
    if (!targetProduct) {
      return res.status(404).send({
        success: false,
        message: "Product not found.",
      });
    } else if (["SOLD", "ON_AUCTION"].includes(targetProduct.status)) {
      return res.status(400).send({
        success: false,
        message: `Target product is already ${targetProduct.status}.`,
      });
    } else if (targetProduct.adminApproval !== "APPROVED") {
      return res.status(400).send({
        success: false,
        message: `The product must be approved to set on auction. Current status: ${targetProduct.adminApproval}.`,
      });
    } else if (!success) {
      return res.status(400).send({
        success,
        message,
      });
    } else if (threshold > startPrice) {
      return res.status(400).send({
        success: false,
        message: "threshold can't be higher than starting price",
      });
    }
    // this is not realistic but this is the least and mendatory validation
    else if (minBidIncrement > threshold / 3) {
      return res.status(400).send({
        success: false,
        message: "Minimum bid increment must be 1/3 of threshold value",
      });
    } else {
      req.body.auctionStart = convertedStart;
      req.body.auctionEnd = convertedEnd;

      const addResult = await auctionService.createAuction({
        ...req.body,
        seller: req.user_id,
      });
      sendCreateResponse({
        res,
        what: operableEntities.auction,
        data: addResult,
      });
    }
  } catch (error) {
    console.error("Controller: createAuction - Error:", error.message);
    sendErrorResponse({ res, error, what: operableEntities.auction });
  }
}
//
async function getSingleAuction(req, res) {
  try {
    const targetAuctionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetAuctionId)) {
      return res.status(400).send({ message: "Invalid resource (auction) id" });
    }

    const result = await auctionService.getSingleAuction(targetAuctionId);
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.auction,
      });
    } else {
      sendSingleFetchResponse({
        res,
        data: result,
        what: operableEntities.auction,
      });
    }
  } catch (error) {
    console.error("Controller: getSingleAuction - Error: ", error.message);
    sendErrorResponse({ res, error, what: operableEntities.auction });
  }
}
//
async function updateAuction(req, res) {
  try {
    //
    const targetAuctionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetAuctionId)) {
      return res.status(400).send({ message: "Invalid resource (auction) id" });
    }
    //
    const targetAuction = await Auction.findById(targetAuctionId);
    if (!targetAuction) {
      return res.status(404).send({
        success: false,
        message: "Auction not found.",
      });
    }
    //
    const invalidStatusChangeFromAndTo = ["SOLD", "OPEN", "UNSOLD"]; // no change allowed while status being any of these
    //
    if (invalidStatusChangeFromAndTo.includes(targetAuction.status)) {
      return res.status(404).send({
        success: false,
        message: `Can't bring change to ${targetAuction.status} Auction.`,
      });
    }
    const statusChangeTo = req.body.status || targetAuction.status;

    // map of what status can be changed to which statuses; control of transition of status
    if (invalidStatusChangeFromAndTo.includes(statusChangeTo)) {
      return res.status(400).send({
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
    if (data.status === "PENDING") {
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
        return res.status(400).send({ success, message });
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
        .send({ success: false, message: "Product not found." });
    }

    if (["SOLD", "ON_AUCTION"].includes(targetProduct.status)) {
      return res.status(400).send({
        success: false,
        message: `Target product is already ${targetProduct.status}.`,
      });
    }

    if (targetProduct.adminApproval !== "APPROVED") {
      return res.status(400).send({
        success: false,
        message: `The product must be approved to set on auction. Current status: ${targetProduct.adminApproval}.`,
      });
    }

    if (data.threshold > data.startPrice) {
      return res.status(400).send({
        success: false,
        message: "Threshold can't be higher than starting price",
      });
    }

    if (data.minBidIncrement > data.threshold / 3) {
      return res.status(400).send({
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
        what: operableEntities.auction,
      });
    }

    // Success case
    sendUpdateResponse({
      res,
      data: result,
      what: operableEntities.auction,
    });
  } catch (error) {
    console.error("Controller: updateAuction - Error:", error.message);
    sendErrorResponse({ res, error, what: operableEntities.auction });
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
        what: operableEntities.auction,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.auction });
    }
  } catch (error) {
    console.error("Controller: getAuctions - Error:", error.message);
    sendErrorResponse({
      res,
      error,
      what: operableEntities.auction,
    });
  }
}
//
async function deleteAuction(req, res) {
  try {
    const targetAuctionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetAuctionId)) {
      return res.status(400).send({ message: "Invalid resource (auction) id" });
    }

    const targetAuction = await Auction.findById(targetAuctionId);
    if (!targetAuction) {
      return res.status(404).send({
        success: false,
        message: "Auction doesn't exist.",
      });
    }
    // ["OPEN", "UNSOLD", "PENDING", "SOLD", "CANCELLED"]
    const totalDeleteMap = {
      [allowedRoles.admin]: ["OPEN", "PENDING", "CANCELLED"],
      [allowedRoles.seller]: ["PENDING", "CANCELLED"],
    };
    const deleteButKeepRecordMap = {
      [allowedRoles.admin]: ["UNSOLD", "SOLD"], // depend on business logic .. not sure  15.10.24
      [allowedRoles.seller]: [],
    };
    //
    let resultDeletion;
    if (
      (req.role === allowedRoles.admin &&
        totalDeleteMap[allowedRoles.admin].includes(targetAuction.status)) ||
      (req.role === allowedRoles.seller &&
        totalDeleteMap[allowedRoles.seller].includes(targetAuction.status))
    ) {
      resultDeletion = await Auction.findByIdAndDelete(targetAuctionId);
      return res.status(200).send({
        success: true,
        message: "Auction deleted permanently.",
      });
    }

    if (
      (req.role === allowedRoles.admin &&
        deleteButKeepRecordMap[allowedRoles.admin].includes(
          targetAuction.status
        )) ||
      (req.role === allowedRoles.seller &&
        deleteButKeepRecordMap[allowedRoles.seller].includes(
          targetAuction.status
        ))
    ) {
      resultDeletion = await Auction.findByIdAndUpdate(
        targetAuctionId,
        { isDeleted: true },
        { new: true }
      );
      return res.status(200).send({
        success: true,
        message: "Auction deleted successfully.",
      });
    }
  } catch (error) {
    console.error("Controller: deleteAuction - Error:", error.message);
    sendErrorResponse({
      res,
      error,
      what: operableEntities.auction,
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
};
