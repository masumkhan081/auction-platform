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

async function createAuction(req, res) {
  try {
    const { name, description } = req.body;
    const addResult = await Auction.create({
      name,
      description,
    });
    sendCreateResponse({
      res,
      what: operableEntities.auction,
      data: addResult,
    });
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
