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

    if (addResult) {
      const auctionId = addResult.id;

      console.log("Auction created, scheduling cron job...");

      const cronJob = cron.schedule("* * * * *", async () => {
        try {
          const now = moment.utc();
          const targetAuction = await Auction.findById(auctionId);

          if (!targetAuction) {
            console.error("Auction not found! Stopping cron job.");
            cronJob.stop();
            return;
          }

          console.log("Checking auction status: " + targetAuction.status);

          if (
            now.isSameOrAfter(moment(targetAuction.auctionStart)) &&
            targetAuction.status !== "OPEN"
          ) {
            await Auction.findByIdAndUpdate(auctionId, { status: "OPEN" });
          }

          if (
            now.isSameOrAfter(moment(targetAuction.auctionEnd)) &&
            targetAuction.status === "OPEN"
          ) {
            try {
              const highestBid = await Bid.findOne({ auction: auctionId })
                .sort({ bidAmount: -1 })
                .limit(1)
                .exec();

              if (highestBid) {
                if (highestBid.bidAmount >= targetAuction.threshold) {
                  targetAuction.status = "SOLD";
                  highestBid.isWinner = true;
                  await highestBid.save();
                } else {
                  targetAuction.isFlagged = true;
                  targetAuction.status = "UNSOLD";
                }
              } else {
                targetAuction.status = "UNSOLD";
              }

              await targetAuction.save();
              console.log("Auction finished, stopping the cron job.");
              cronJob.stop();
            } catch (error) {
              console.log("Error deciding winner: " + error.message);
            }
          }
        } catch (error) {
          console.log("Error in cron job: " + error.message);
        }
      });
    }

    return addResult;
  } catch (error) {
    console.log("createAuction: " + error.message);
    return error;
  }
}

async function getSingleAuction(id) {
  try {
    const getResult = await Auction.findById(id).populate("product");
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

    console.log("query:" + JSON.stringify(query));

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

module.exports = {
  createAuction,
  getAuctions,
  getSingleAuction,
  updateAuction,
};
