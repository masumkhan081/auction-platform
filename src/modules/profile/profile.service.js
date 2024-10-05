/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Seller = require("./profile.model");
const { getSearchAndPagination } = require("../../utils/pagination");

async function createSeller(data) {
  try {
    const addResult = await Seller.create(data);
    return addResult;
  } catch (error) {
    return error;
  }
}
//
async function getSellers(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.address });

    const fetchResult = await Seller.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Seller.countDocuments(filterConditions);
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
async function updateSeller({ id, data }) {
  try {
    const editResult = await Seller.findByIdAndUpdate(id, data, {
      new: true,
    });
    return editResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteSeller(id) {
  try {
    const deleteResult = await Seller.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createSeller,
  updateSeller,
  deleteSeller,
  getSellers,
};
