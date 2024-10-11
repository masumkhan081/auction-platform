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
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const { isAuctionEndValid } = require("./auction.validate");

//
async function createAuction(req, res) {
  try {
    if (isAuctionEndValid(req.body)) {
      const addResult = await auctionService.createAuction(req.body);
      sendCreateResponse({
        res,
        what: operableEntities.auction,
        data: addResult,
      });
    } else {
      res.status(400).send({
        success: false,
        statusCode: 400,
        message: "Auction end time must be after start time",
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
      sendFetchResponse({ res, data: result, what: operableEntities.auction });
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
