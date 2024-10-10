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
const { operableEntities } = require("../../config/constants");
const productModel = require("../product/product.model");

async function getSingleCategory(req, res) {
  try {
    const result = await categoryService.getSingleCategory(req.params.id);
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.category,
      });
    } else {
      sendSingleFetchResponse({ res, data: result, what: operableEntities.category });
    }
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.category });
  }
}

async function createProductCategory(req, res) {
  try {
    const { name, description } = req.body;
    const addResult = await Category.create({
      name,
      description,
    });
    sendCreateResponse({
      res,
      what: operableEntities.category,
      data: addResult,
    });
  } catch (error) {
    
    sendErrorResponse({ res, error, what: operableEntities.category });
  }
}
//
async function updateCategory(req, res) {
  try {
    const result = await categoryService.updateCategory({
      id: req.params.id,
      data: req.body,
    });
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.category,
      });
    } else {
      sendUpdateResponse({
        res,
        data: result,
        what: operableEntities.category,
      });
    }
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.category });
  }
}
//
async function getCategories(req, res) {
  try {
    const result = await categoryService.getCategories(req.query);
    if (result instanceof Error) {
      sendErrorResponse({
        res,
        error: result,
        what: operableEntities.category,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.category });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.category,
    });
  }
}
//
async function deleteCategory(req, res) {
  try {
    const isUsed = await productModel.countDocuments({
      category: req.params.id,
    });
    
    if (isUsed === 0) {
      const result = await categoryService.deleteCategory(req.params.id);
      if (result instanceof Error) {
        sendErrorResponse({
          res,
          error: result,
          what: operableEntities.category,
        });
      } else {
        sendDeletionResponse({
          res,
          data: result,
          what: operableEntities.category,
        });
      }
    } else {
      sendErrorResponse({
        res,
        error: responseMap.already_used,
        what: operableEntities.category,
      });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.category,
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
