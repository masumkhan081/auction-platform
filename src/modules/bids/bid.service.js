/* eslint-disable no-unused-vars */
const { entities } = require("../../config/constants");
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
const getSingleBid = async (updatableId) => Bid.findById(updatableId);

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
    } = getSearchAndPagination({ query, what: entities.bid });

    console.log(
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions
    );

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
const updateBid = async ({ id, data }) =>
  Bid.findByIdAndUpdate(id, data, { new: true });

//
const deleteBid = async (id) => Bid.findByIdAndDelete(id);

module.exports = {
  createBid,
  deleteBid,
  getBids,
  getSingleBid,
  updateBid,
};
