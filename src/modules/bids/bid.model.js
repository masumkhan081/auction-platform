const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auctions",
    required: true,
  },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  bidAmount: { type: Number, required: true },
  bidTime: { type: Date, default: Date.now },
  isWinner: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("bids", bidSchema);
