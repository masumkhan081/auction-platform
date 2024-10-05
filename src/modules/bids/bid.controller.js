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
    const { name, description } = req.body;
    const addResult = await Bid.create({
      name,
      description,
    });
    sendCreateResponse({
      res,
      what: operableEntities.bid,
      data: addResult,
    });
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
