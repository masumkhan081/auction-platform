/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Auction = require("./auction.model");
const { getSearchAndPagination } = require("../../utils/pagination");
const cron = require("node-cron");
const Bid = require("../bids/bid.model");
const moment = require("moment-timezone");
//
async function createAuction(data) {
  try {
    const addResult = await Auction.create(data);
    const auctionId = addResult.id;
    //
    console.log("got hit !");
    // Schedule a cron job to check the auction status every minute
    cron.schedule("* * * * *", async () => {
      const now = moment.utc(); // Current time in UTC

      const targetAuction = await Auction.findById(auctionId);
      console.log("checking ..." + targetAuction.status);

      // Check if the auction should be opened
      if (
        now.isSameOrAfter(moment(targetAuction.auctionStart)) &&
        targetAuction.status !== "OPEN"
      ) {
        await Auction.findByIdAndUpdate(auctionId, { status: "OPEN" });
      }
      if (
        now.isSameOrAfter(moment(targetAuction.auctionEnd)) &&
        targetAuction.status === "OPEN" // Change from Open to UNSOLD
      ) {
        try {
          //
          const highestBid = await Bid.findOne({ auction: auctionId })
            .sort({ bidAmount: -1 }) // sort by bidAmount in descending order
            .limit(1) // i just need the highest
            .exec();
          //
          if (highestBid) {
            // having a highest bid doesn't mean it should be sold, have to be above the threshold
            if (highestBid?.bidAmount >= targetAuction.threshold) {
              targetAuction.status = "SOLD";
              highestBid.isWinner = true;
            } else {
              targetAuction.isFlagged = true;
              targetAuction.status = "UNSOLD";
            }
          } else {
            targetAuction.status = "UNSOLD";
          }
          await highestBid.save();
          await targetAuction.save();
        } catch (error) {
          console.log("error deciding winner " + error.message);
          return error;
        }
      }
    });

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
