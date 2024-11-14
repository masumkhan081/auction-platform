const bidService = require("./bid.service");
const httpStatus = require("http-status");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  responseMap,
  sendSingleFetchResponse,
} = require("../../utils/responseHandler");
const { entities, userRoles } = require("../../config/constants");
const Auction = require("../auction/auction.model");
const Bid = require("./bid.model");
const { default: mongoose } = require("mongoose");
//
async function getBids(req, res) {
  try {
    const { userId, role } = req;
    //
    const { auction } = req.query;
    //
    const appliedQuery = { auction };

    switch (role) {
      case userRoles.seller:
        // Handle seller logic here
        break;
      case userRoles.bidder:
        appliedQuery.bidder = userId;
        break;
      default:
        // Handle case where role doesn't match any allowed roles
        break;
    }

    const result = await bidService.getBids(req.query);

    sendFetchResponse({ res, data: result, what: entities.bid });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.bid,
    });
  }
}

async function getSingleBid(req, res) {
  try {
    const result = await bidService.getSingleBid(req.params.id);
    sendSingleFetchResponse({ res, data: result, what: entities.bid });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.bid });
  }
}

async function createBid(req, res) {
  try {
    const { auction, bidAmount } = req.body;

    // Fetch the auction details
    const targetAuction = await Auction.findById(auction);

    // Check if the auction exists
    if (!targetAuction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found.",
      });
    }

    // Ensure the auction is open for bidding
    if (targetAuction.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "The auction is not open for bidding.",
      });
    }

    // Calculate the minimum required bid amount
    const minimumBidAmount =
      targetAuction.currentHighest + targetAuction.minBidIncrement;
    if (bidAmount < minimumBidAmount) {
      return res.status(400).json({
        success: false,
        message: `Your bid must be at least ${minimumBidAmount}. Current highest bid: ${targetAuction.currentHighest}, Minimum bid increment: ${targetAuction.minBidIncrement}.`,
      });
    }

    // Create the bid
    const newBid = await bidService.createBid({
      auction,
      bidder: req.userId,
      bidAmount,
      isFlagged: bidAmount < targetAuction.startPrice * 0.5,
    });

    console.log("New bid created:", JSON.stringify(newBid));
    return sendCreateResponse({
      res,
      data: newBid,
      what: entities.bid,
    });
  } catch (error) {
    console.error("Error in createBid:", error.message);
    return sendErrorResponse({
      res,
      error: "An error occurred while creating the bid.",
      what: entities.bid,
    });
  }
}

//  - can't se any use of it
async function updateBid(req, res) {
  try {
    const targetBidId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetBidId)) {
      return res.status(400).json({ message: "Invalid resource (bid) id" });
    }

    const targetBid = await Bid.findById(targetBidId);
    if (!targetBid) {
      return res
        .status(400)
        .json({ message: "Invalid bid ID or bid not found." });
    }
    const targetAuction = await Auction.findById(targetBid.auction);

    if (!targetAuction || targetAuction?.isDeleted) {
      return res.status(400).json({
        message:
          "Update failed as the belonging auction doesn't exist anymore.",
      });
    }

    if (targetAuction.status !== "OPEN") {
      return res.status(400).json({
        message: `Update failed as the belonging auction (${targetAuction.status}) is not currently open for bidding.`,
      });
    }

    //
    const { bidAmount } = req.body;
    // Check if the bid amount is higher than the current price + minBidIncrement
    const requiredBidAmount =
      targetAuction.currentHighest + targetAuction.minBidIncrement;
    if (bidAmount < requiredBidAmount) {
      return res.status(400).json({
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
    sendUpdateResponse({
      res,
      data: result,
      what: entities.bid,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.bid });
  }
}
//
async function deleteBid(req, res) {
  try {
    const targetBid = await Bid.findById(req.params.id);
    if (!targetBid) {
      return res
        .status(400)
        .json({ message: "Invalid bid ID or bid not found." });
    }
    const targetAuction = await Auction.findById(targetBid.auction);

    if (targetAuction?.isDeleted) {
      return res.status(400).json({
        message: "The belonging auction doesn't exist anymore.",
      });
    }

    if (targetAuction.status !== "OPEN") {
      return res.status(400).json({
        message: `Can't delete bid of an auction that is closed or cancelled.`,
      });
    }

    if (targetBid.isWinner) {
      return res.status(400).json({
        success: false,
        message: "Can't delete the winner bid after auction",
      });
    }
    const result = await bidService.deleteBid(req.params.id);

    sendDeletionResponse({
      res,
      data: result,
      what: entities.bid,
    });
    //
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.bid,
    });
  }
}
async function getBidHistory(req, res) {
  try {
    const { auction, isWinner } = req.query;
    const { userId, role } = req;
    const appliedQuery = {};
    //
    if (auction) {
      appliedQuery.auction = auction;
    }
    if (isWinner) {
      appliedQuery.isWinner = isWinner;
    }
    switch (role) {
      case userRoles.seller:
        appliedQuery.auction.seller = userId;
        break;
      case userRoles.bidder:
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
//
module.exports = {
  createBid,
  updateBid,
  deleteBid,
  getBids,
  getSingleBid,
  getBidHistory
};
