const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
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
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: props => `Bid amount must be a positive number. You entered ${props.value}`,
    },
  },
  bidTime: {
    type: Date,
    default: Date.now,
  },
  isWinner: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("bids", bidSchema);
