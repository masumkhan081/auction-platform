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
const { entities } = require("../../config/constants");
const feedbackService = require("./feedback.service");
const Product = require("../auction/auction.model");
const Feedback = require("./feedback.model");
const auctionModel = require("../auction/auction.model");

async function getSingleFeedback(req, res) {
  try {
    const result = await feedbackService.getSingleFeedback(req.params.id);

    sendSingleFetchResponse({
      res,
      data: result,
      what: entities.feedback,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.feedback });
  }
}

async function createFeedback(req, res) {
  try {
    const { userId: reviewer, role: reviewerRole } = req;
    const { auction, reviewText, rating } = req.body;

    const targetAuction = await auctionModel.findById(auction);
    //
    if (!targetAuction) {
      return res.status(400).json({
        message: "Target auction not found",
      });
    }
    //
    const addResult = await feedbackService.createFeedback({
      auction,
      reviewText,
      rating,
      reviewer,
      reviewerRole,
    });

    sendCreateResponse({
      res,
      what: entities.feedback,
      data: addResult,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.feedback });
  }
}
//
async function updateFeedback(req, res) {
  try {
    const { id: feedbackId } = req.params;
    const { userId } = req;

    const targetFeedback = await Feedback.findById(feedbackId);

    if (!targetFeedback) {
      return res.status(400).json({
        message: "Target feedback not found",
      });
    }
    //
    if (userId !== targetFeedback.reviewer) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = {
      reviewText: req.body.reviewText || targetFeedback.reviewText,
      rating: req.body.rating || targetFeedback.rating,
    };

    const result = await feedbackService.updateFeedback({
      id: feedbackId,
      data,
    });

    sendUpdateResponse({
      res,
      data: result,
      what: entities.feedback,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.feedback });
  }
}
//
async function getFeedbacks(req, res) {
  try {
    const result = await feedbackService.getFeedbacks(req.query);

    sendFetchResponse({ res, data: result, what: entities.feedback });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.feedback,
    });
  }
}
//
async function deleteFeedback(req, res) {
  try {
    const isUsed = await productModel.countDocuments({
      auction: req.params.id,
    });

    if (isUsed === 0) {
      const result = await feedbackService.deleteFeedback(req.params.id);

      sendDeletionResponse({
        res,
        data: result,
        what: entities.feedback,
      });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.feedback,
    });
  }
}
//
module.exports = {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbacks,
  getSingleFeedback,
};
