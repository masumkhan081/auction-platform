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
const { operableEntities } = require("../../config/constants");
const feedbackService = require("./feedback.service");
const Product = require("../auction/auction.model");
const Feedback = require("./feedback.model");

async function getSingleFeedback(req, res) {
  try {
    const result = await feedbackService.getSingleFeedback(req.params.id);
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.feedback,
      });
    } else {
      sendSingleFetchResponse({
        res,
        data: result,
        what: operableEntities.feedback,
      });
    }
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.feedback });
  }
}

async function createFeedback(req, res) {
  try {
    const addResult = await Feedback.create(req.body);
    sendCreateResponse({
      res,
      what: operableEntities.feedback,
      data: addResult,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.feedback });
  }
}
//
async function updateFeedback(req, res) {
  try {
    const result = await feedbackService.updateFeedback({
      id: req.params.id,
      data: req.body,
    });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.feedback,
      });
    } else {
      sendUpdateResponse({
        res,
        data: result,
        what: operableEntities.feedback,
      });
    }
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.feedback });
  }
}
//
async function getFeedbacks(req, res) {
  try {
    const result = await feedbackService.getFeedbacks(req.query);
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.feedback,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.feedback });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.feedback,
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
      if (result instanceof Error) {
        sendErrorResponse({
          res,
          error: result,
          what: operableEntities.feedback,
        });
      } else {
        sendDeletionResponse({
          res,
          data: result,
          what: operableEntities.feedback,
        });
      }
    } else {
      sendErrorResponse({
        res,
        error: responseMap.alreadyUsed,
        what: operableEntities.feedback,
      });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.feedback,
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
