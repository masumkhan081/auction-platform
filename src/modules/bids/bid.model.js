const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auctions",
      required: [true, "Auction reference is required"],
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Bidder reference is required"],
    },
    bidAmount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [1, "Bid amount must be at least 1"],
    },
    bidTime: {
      type: Date,
      default: Date.now,
    },
    isWinner: {
      type: Boolean,
      default: false,
    },
    isFlagged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = mongoose.model("bids", bidSchema);
