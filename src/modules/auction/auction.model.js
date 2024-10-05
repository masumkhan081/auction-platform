const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const auctionSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
    },
    startPrice: { type: Number, required: true },
    timeZone: {
      type: String,
    },
    currentPrice: { type: Number, default: 0 },
    auctionStart: { type: Date, required: true }, // Auction start time
    auctionEnd: { type: Date, required: true }, // Auction end time
    bidIncrement: { type: Number, required: true }, // Minimum increment for bids
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    isOpen: { type: Boolean, default: false },
    isSold: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("auction", auctionSchema);
