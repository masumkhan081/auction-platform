/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Auction = require("./auction.model");
const { getSearchAndPagination } = require("../../utils/pagination");

//
async function createAuction(data) {
  try {
    const addResult = await Auction.create(data);
    return addResult;
  } catch (error) {
    console.log(error.message);
    return error;
  }
}

async function getSingleAuction(id) {
  try {
    const getResult = await Auction.findById(id);
    return getResult;
  } catch (error) {
    return error;
  }
}

async function getAuctions(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.auction });

    const fetchResult = await Auction.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Auction.countDocuments(filterConditions);
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
async function updateAuction({ id, data }) {
  try {
    const updateResult = await Auction.findByIdAndUpdate(id, data, {
      new: true,
    });
    return updateResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteAuction(id) {
  try {
    const deleteResult = await Auction.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createAuction,
  deleteAuction,
  getAuctions,
  getSingleAuction,
  updateAuction,
};
