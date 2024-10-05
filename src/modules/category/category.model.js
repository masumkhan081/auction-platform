/* eslint-disable no-unused-vars */
const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Category name is required"],
      minlength: [3, "Category name must be at least 3 characters long"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9\s]+$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid category name! Only letters, numbers, and spaces are allowed.`,
      },
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("categories", categorySchema);
