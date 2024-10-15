const bidService = require("./bid.service");
const httpStatus = require("http-status");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  responseMap,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const Auction = require("../auction/auction.model");
const Bid = require("./bid.model");
const { default: mongoose } = require("mongoose");
//

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

async function getBidHistory(req, res) {
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
    const targetAuction = await Auction.findById(auction);

    // Check if auction exists
    if (!targetAuction) {
      return res.status(404).send({
        success: false,
        message: "Auction not found.",
      });
    }
    // Ensure the auction status is 'OPEN'
    if (targetAuction.status !== "OPEN") {
      return res.status(400).send({
        success: false,
        message: "The auction is not open for bidding",
      });
    }
    // Check if the bid amount is higher than the current price + minBidIncrement
    const requiredBidAmount =
      targetAuction.currentHighest + targetAuction.minBidIncrement;
    if (bidAmount < requiredBidAmount) {
      return res.status(400).send({
        success: false,
        message: `Minimum available bid at this moment: ${requiredBidAmount}. CHB:(${targetAuction.currentHighest}) + MBI:(${targetAuction.minBidIncrement}) `,
      });
    }

    const result = await bidService.createBid({
      auction,
      bidder: req.user_id,
      bidAmount,
      isFlagged: bidAmount < targetAuction.startPrice * 0.5,
    });
    console.log(JSON.stringify(result));
    sendCreateResponse({ res, data: result, what: operableEntities.bid });
  } catch (error) {
    console.log("error: " + error.message);
    sendErrorResponse({ res, error, what: operableEntities.bid });
  }
}
//  - can't se any use of it
async function updateBid(req, res) {
  try {
    const targetBidId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetBidId)) {
      return res.status(400).send({ message: "Invalid resource (bid) id" });
    }

    const targetBid = await Bid.findById(targetBidId);
    if (!targetBid) {
      return res
        .status(400)
        .send({ message: "Invalid bid ID or bid not found." });
    }
    const targetAuction = await Auction.findById(targetBid.auction);

    if (!targetAuction || targetAuction?.isDeleted) {
      return res.status(400).send({
        message:
          "Update failed as the belonging auction doesn't exist anymore.",
      });
    }

    if (targetAuction.status !== "OPEN") {
      return res.status(400).send({
        message: `Update failed as the belonging auction (${targetAuction.status}) is not currently open for bidding.`,
      });
    }

    //
    const { bidAmount } = req.body;
    // Check if the bid amount is higher than the current price + minBidIncrement
    const requiredBidAmount =
      targetAuction.currentHighest + targetAuction.minBidIncrement;
    if (bidAmount < requiredBidAmount) {
      return res.status(400).send({
        success: false,
        message: `Minimum available bid at this moment: ${requiredBidAmount}. CHB:(${targetAuction.currentHighest}) + MBI:(${targetAuction.minBidIncrement}) `,
      });
    }
    const isFlagged = bidAmount < targetAuction.startPrice * 0.5;

    const result = await bidService.updateBid({
      id: targetBidId,
      data: { bidAmount, isFlagged },
    });
    //

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
    const result = await bidService.getBids(req.query);
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
    const targetBid = await Bid.findById(req.params.id);
    if (!targetBid) {
      return res
        .status(400)
        .send({ message: "Invalid bid ID or bid not found." });
    }
    const targetAuction = await Auction.findById(targetBid.auction);

    if (targetAuction?.isDeleted) {
      return res.status(400).send({
        message: "The belonging auction doesn't exist anymore.",
      });
    }

    if (targetAuction.status !== "OPEN") {
      return res.status(400).send({
        message: `Can't delete. The belonging auction is closed or cancelled.`,
      });
    }

    if (targetBid.isWinner) {
      return res.status(400).send({
        success: false,
        message: "Can't delete the winner bid after auction",
      });
    }
    const result = await bidService.deleteBid(req.params.id);
    if (result instanceof Error) {
      return sendErrorResponse({
        res,
        error: result,
        what: operableEntities.bid,
      });
    }
    sendDeletionResponse({
      res,
      data: result,
      what: operableEntities.bid,
    });
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
  getBidHistory,
};
