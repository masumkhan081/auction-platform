/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Product = require("./product.model");
const { getSearchAndPagination } = require("../../utils/pagination");
const {
  sendErrorResponse,
  responseMap,
} = require("../../utils/responseHandler");

async function createProduct(data) {
  try {
    const addResult = await Product.create(data);
    return addResult;
  } catch (error) {
    return error;
  }
}
//

async function getSingleProduct(id) {
  try {
    const fetchResult = await Product.findById(id).populate("category");
    console.log(JSON.stringify(fetchResult));
    return fetchResult;
  } catch (error) {
    return error;
  }
}

async function getProducts(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.product });

    if (query?.["category"]) {
      filterConditions["category"] = query[category];
    }

    console.log(
      JSON.stringify(filterConditions) + "\n" + JSON.stringify(sortConditions)
    );

    const fetchResult = await Product.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit)
      .populate("category");

    const total = await Product.countDocuments(filterConditions);

    return {
      meta: {
        total,
        limit: viewLimit,
        page: currentPage,
        skip: viewSkip,
        sortBy,
        sortOrder,
      },
      data: fetchResult,
    };
  } catch (error) {
    return error;
  }
}
//
async function updateProduct({ id, data }) {
  try {
    const editResult = await Product.findByIdAndUpdate(id, data, {
      new: true,
    });
    return editResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteProduct(id) {
  try {
    const deleteResult = await Product.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

async function updateApprovalByAdmin({ id, data }) {
  try {
    const { approval, reviewNote } = data;
    const editResult = await Product.findByIdAndUpdate(
      id,
      { approval, reviewNote },
      { new: true }
    );
    return editResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getSingleProduct,
  updateApprovalByAdmin,
};
