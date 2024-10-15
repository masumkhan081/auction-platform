/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const { getSearchAndPagination } = require("../../utils/pagination");
const Bid = require("./bid.model");
const Auction = require("../auction/auction.model");
//
async function createBid(data) {
  let bid;
  try {
    bid = await Bid.create(data);

    await Auction.findByIdAndUpdate(data.auction, {
      currentHighest: data.bidAmount,
    });
    //
    return bid;
  } catch (error) {
    if (bid) {
      await Bid.deleteOne({ _id: bid._id });
    }
    console.log(" Service: createBid " + error.message);
    return error;
  }
}
//
async function getSingleBid(updatableId) {
  try {
    const getResult = await Bid.findById(updatableId);
    return getResult;
  } catch (error) {
    console.log(" Service: getSingleBid " + error.message);
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
    } = getSearchAndPagination({ query, what: operableEntities.bid });

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
    console.log(" Service: getBids " + error.message);
    return error;
  }
}
//
async function updateBid({ id, data }) {
  try {
    const updateResult = await Bid.findByIdAndUpdate(id, data, { new: true });
    return updateResult;
  } catch (error) {
    console.log(" Service: updateBid " + error.message);
    return error;
  }
}
//
async function deleteBid(id) {
  try {
    const deleteResult = await Bid.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    console.log(" Service: deleteBid " + error.message);
    return error;
  }
}

module.exports = {
  createBid,
  deleteBid,
  getBids,
  getSingleBid,
  updateBid,
};
