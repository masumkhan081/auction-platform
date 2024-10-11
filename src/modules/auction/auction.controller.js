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
const { operableEntities } = require("../../config/constants");
const { validateAndConvertToUTC } = require("./auction.validate");
const productModel = require("../product/product.model");

//
async function createAuction(req, res) {
  try {
    //
    const { product, auctionStart, auctionEnd, timeZone } = req.body;
    //
    const {
      success,
      message,
      auctionStart: convertedStart,
      auctionEnd: convertedEnd,
    } = validateAndConvertToUTC({ auctionStart, auctionEnd, timeZone });
    //
    const targetProduct = await productModel.findById(product);
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
    sendErrorResponse({ res, error, what: operableEntities.auction });
  }
}
//
async function getSingleAuction(req, res) {
  try {
    const result = await auctionService.getSingleAuction(req.params.id);
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
    sendErrorResponse({ res, error, what: operableEntities.auction });
  }
}
//
async function updateAuction(req, res) {
  try {
    const result = await auctionService.updateAuction({
      id: req.params.id,
      data: req.body,
    });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.auction,
      });
    } else {
      sendUpdateResponse({
        res,
        data: result,
        what: operableEntities.auction,
      });
    }
  } catch (error) {
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
    const isUsed = await Auction.countDocuments({
      category: req.params.id,
    });
    console.log("isUsed  " + isUsed);
    if (isUsed === 0) {
      const result = await auctionService.deleteAuction(req.params.id);
      if (result instanceof Error) {
        sendErrorResponse({
          res,
          error: result,
          what: operableEntities.auction,
        });
      } else {
        sendDeletionResponse({
          res,
          data: result,
          what: operableEntities.auction,
        });
      }
    } else {
      sendErrorResponse({
        res,
        error: responseMap.already_used,
        what: operableEntities.auction,
      });
    }
  } catch (error) {
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
