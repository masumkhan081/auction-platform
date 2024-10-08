/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Bid = require("./bid.model");
const { getSearchAndPagination } = require("../../utils/pagination");

//

async function getSingleBid(updatableId) {
  try {
    const getResult = await Bid.findById(updatableId);
    return getResult;
  } catch (error) {
    return error;
  }
}

async function getBids(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.category });

    const fetchResult = await Bid.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Bid.countDocuments(filterConditions);
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
async function updateBid({ id, data }) {
  try {
    const { name, description } = data;
    const updateResult = await Bid.findByIdAndUpdate(
      id,
      {
        name,
        description,
      },
      { new: true }
    );
    return updateResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteBid(id) {
  try {
    const deleteResult = await Bid.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  deleteBid,
  getBids,
  getSingleBid,
  updateBid,
};
