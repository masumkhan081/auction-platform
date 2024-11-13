const categoryService = require("./category.service");
const httpStatus = require("http-status");
const Category = require("./category.model");
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
const productModel = require("../product/product.model");
//
async function getSingleCategory(req, res) {
  try {
    const result = await categoryService.getSingleCategory(req.params.id);
    if (result instanceof Error) {
      return sendErrorResponse({
        res,
        error: result,
        what: entities.category,
      });
    }
    sendSingleFetchResponse({
      res,
      data: result,
      what: entities.category,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.category });
  }
}

async function createProductCategory(req, res) {
  try {
    const addResult = await categoryService.createCategory(req.body);

    sendCreateResponse({
      res,
      what: entities.category,
      data: addResult,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.category });
  }
}
//
async function updateCategory(req, res) {
  try {
    const result = await categoryService.updateCategory({
      id: req.params.id,
      data: req.body,
    });

    return sendUpdateResponse({
      res,
      data: result,
      what: entities.category,
    });
  } catch (error) {
    sendErrorResponse({ res, error, what: entities.category });
  }
}
//
async function getCategories(req, res) {
  try {
    const result = await categoryService.getCategories(req.query);
    sendFetchResponse({ res, data: result, what: entities.category });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.category,
    });
  }
}

//
async function deleteCategory(req, res) {
  try {
    const isUsed = await productModel.countDocuments({
      category: req.params.id,
    });

    if (isUsed > 0) {
      return sendErrorResponse({
        res,
        error: responseMap.alreadyUsed,
        what: entities.category,
      });
    }

    const result = await categoryService.deleteCategory(req.params.id);
    return sendDeletionResponse({
      res,
      data: result,
      what: entities.category,
    });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.category,
    });
  }
}

//
module.exports = {
  createProductCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getSingleCategory,
};
