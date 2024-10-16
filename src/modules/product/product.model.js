/* eslint-disable no-unused-vars */

const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
//
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      minlength: [3, "Product name must be at least 3 characters long"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9\s-_]+$/.test(v); // Allow letters, digits, spaces, hyphens, and underscores
        },
        message: (props) =>
          `${props.value} is not valid! Only letters, numbers, spaces, hyphens, and underscores are allowed.`,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      required: [true, "Category is required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Seller user id is required"],
    },
    productImages: [
      {
        type: String,
      },
    ],
    productDetail: {
      type: String,
      required: [true, "Product detail is required"],
      minlength: [10, "Product detail must be at least 10 characters long"],
      maxlength: [1000, "Product detail cannot exceed 1000 characters"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9\s-_]+$/.test(v); // Allow letters, digits, spaces, hyphens, and underscores
        },
        message: (props) =>
          `${props.value} is not valid! Only letters, numbers, spaces, hyphens, and underscores are allowed.`,
      },
    },
    status: {
      type: String,
      enum: {
        values: ["SOLD", "UNSOLD", "ON_AUCTION", "INACTIVE"],
        message: "Status must be either SOLD, UNSOLD, ON_AUCTION, or INACTIVE",
      },
      default: "INACTIVE", // Seller did not set this product for auction yet, just added
    },
    adminApproval: {
      type: String,
      enum: {
        values: ["APPROVED", "DISAPPROVED", "CANCELLED", "PENDING"],
        message:
          "Approval status must be either APPROVED, DISAPPROVED, or CANCELLED",
      },
      default: "PENDING", // Until admin reviews the product, the default is pending
    },
    reviewNote: {
      // In case admin disapproves/cancels approval - may add an explanation or reason
      type: String,
      maxlength: [500, "Approval note cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("products", productSchema);
