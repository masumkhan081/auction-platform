const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const utcTimezones = require("./enum");
//
const auctionSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: [true, "Product is required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Seller is required"],
    },
    timeZone: {
      type: String,
      enum: utcTimezones,
      required: [true, "Time zone is required"],
    },
    startPrice: {
      type: Number,
      required: [true, "Start price is required"],
      min: [0, "Start price must be a positive number"], // Must be non-negative
    },
    currentPrice: {
      type: Number,
      default: 0,
      min: [0, "Current price must be a positive number"], // Must be non-negative
    },
    auctionStart: {
      type: Date,
      required: [true, "Auction start date is required"],
      validate: {
        validator: function (v) {
          return v instanceof Date && !isNaN(v);
        },
        message: "Auction start must be a valid date",
      },
    },
    auctionEnd: {
      type: Date,
      required: [true, "Auction end date is required"],
      validate: {
        validator: function (v) {
          return v instanceof Date && !isNaN(v) && v > this.auctionStart; // Must be after auctionStart
        },
        message: "Auction end must be a valid date and after auction start",
      },
    },
    minBidIncrement: {
      type: Number,
      required: [true, "Bid increment is required"],
      min: [0, "Bid increment must be a positive number"], // Must be non-negative
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    isSold: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("auction", auctionSchema);
