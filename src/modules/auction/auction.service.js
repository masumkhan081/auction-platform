/* eslint-disable no-unused-vars */
const { entities } = require("../../config/constants");
const Auction = require("./auction.model");
const Product = require("../product/product.model");
const { getSearchAndPagination } = require("../../utils/pagination");
const cron = require("node-cron");
const Bid = require("../bids/bid.model");
const moment = require("moment-timezone");
//
async function createAuction(data) {
  try {
    const addResult = await Auction.create(data);
    if (!addResult) throw new Error("Failed to create auction.");

    await Product.findByIdAndUpdate(addResult.product, { status: "PENDING" });

    console.log("Auction created, scheduling cron job...");
    scheduleAuctionCronJob(addResult.id); // Helper function for cron job scheduling

    return addResult;
  } catch (error) {
    console.error("Service: createAuction - Error:", error.message);
    throw error;
  }
}

function scheduleAuctionCronJob(auctionId) {
  const cronJob = cron.schedule("* * * * *", async () => {
    await handleAuctionStatus(auctionId, cronJob);
  });
}

async function handleAuctionStatus(auctionId, cronJob) {
  const now = moment.utc();
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    console.error("Auction not found! Stopping cron job.");
    return cronJob.stop();
  }

  if (["CLOSED", "SOLD", "UNSOLD"].includes(auction.status)) {
    console.log("Auction already closed, stopping cron job.");
    return cronJob.stop();
  }

  console.log("Checking auction status: " + auction.status);

  if (
    now.isSameOrAfter(moment(auction.auctionStart)) &&
    auction.status === "PENDING"
  ) {
    await Auction.findByIdAndUpdate(auctionId, { status: "OPEN" });
    console.log("Auction opened.");
  }

  if (
    now.isSameOrAfter(moment(auction.auctionEnd)) &&
    auction.status === "OPEN"
  ) {
    await handleAuctionEnd(auctionId, auction, cronJob);
  }
}

async function handleAuctionEnd(auctionId, auction, cronJob) {
  const highestBid = await Bid.findOne({ auction: auctionId })
    .sort({ bidAmount: -1 })
    .limit(1);

  let newStatus;
  if (highestBid && highestBid.bidAmount >= auction.threshold) {
    newStatus = "SOLD";
    highestBid.isWinner = true;
    await highestBid.save();
  } else {
    newStatus = "UNSOLD";
    auction.isFlagged = !highestBid; // Flag auction if no bids
  }

  await Auction.findByIdAndUpdate(auctionId, {
    status: newStatus,
    isFlagged: auction.isFlagged,
  });

  console.log("Auction finished with status:", newStatus);
  cronJob.stop();
}

const getSingleAuction = async (id) => Auction.findById(id).populate("product");

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
    } = getSearchAndPagination({ query, what: entities.auction });

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
const updateAuction = async ({ id, data }) =>
  Auction.findByIdAndUpdate(id, data, { new: true }).catch((error) => error);

//

module.exports = {
  createAuction,
  getAuctions,
  getSingleAuction,
  updateAuction,
};
