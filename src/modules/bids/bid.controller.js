const bidService = require("./bid.service");
const httpStatus = require("http-status");
const Bid = require("./bid.model");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  responseMap,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const auctionModel = require("../auction/auction.model");
const bidModel = require("./bid.model");

async function getSingleBid(req, res) {
  try {
    const result = await bidService.getSingleBid(req.params.id);
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
    sendErrorResponse({ res, error, what: operableEntities.bid });
  }
}

async function createBid(req, res) {
  try {
    const { auction, bidAmount } = req.body;

    // Fetch the auction details
    const auctionItem = await auctionModel.findById(auction);

    // Check if auction exists
    if (!auctionItem) {
      return res.status(404).send({
        success: false,
        message: "Auction not found.",
      });
    }
    // Ensure the auction status is 'OPEN'
    if (auctionItem.status !== "OPEN") {
      return res.status(400).send({
        success: false,
        message: "The auction is not open for bidding",
      });
    }
    // Check if the bid amount is higher than the current price + minBidIncrement
    const requiredBidAmount =
      auctionItem.currentPrice + auctionItem.minBidIncrement;
    if (bidAmount < requiredBidAmount) {
      return res.status(400).send({
        success: false,
        message: `Minimum available bid at this moment: ${requiredBidAmount}. CHB:(${auctionItem.currentPrice}) + MBI:(${auctionItem.minBidIncrement}) `,
      });
    }

    const result = await bidService.createBid({
      auction,
      bidder: req.user_id,
      bidAmount,
    });
    sendCreateResponse({ res, data: result, what: operableEntities.bid });
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.bid });
  }
}
//
async function updateBid(req, res) {
  try {
    const result = await bidService.updateCategory({
      id: req.params.id,
      data: req.body,
    });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.bid,
      });
    } else {
      sendUpdateResponse({
        res,
        data: result,
        what: operableEntities.bid,
      });
    }
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.bid });
  }
}
//
async function getBids(req, res) {
  try {
    const result = await bidService.getCategories(req.query);
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
async function deleteBid(req, res) {
  try {
    const isUsed = await productModel.countDocuments({
      category: req.params.id,
    });
    console.log("isUsed  " + isUsed);
    if (isUsed === 0) {
      const result = await bidService.deleteCategory(req.params.id);
      if (result instanceof Error) {
        sendErrorResponse({
          res,
          error: result,
          what: operableEntities.bid,
        });
      } else {
        sendDeletionResponse({
          res,
          data: result,
          what: operableEntities.bid,
        });
      }
    } else {
      sendErrorResponse({
        res,
        error: responseMap.already_used,
        what: operableEntities.bid,
      });
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
module.exports = {
  createBid,
  updateBid,
  deleteBid,
  getBids,
  getSingleBid,
};
