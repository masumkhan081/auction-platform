/* eslint-disable no-unused-vars */
const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const profileSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      minlength: [1, "Full name must be at least 1 character long."],
      maxlength: [100, "Full name must be at most 100 characters long."],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      unique: true,
      minlength: [10, "Phone number must be at least 10 characters long."],
      maxlength: [15, "Phone number must be at most 15 characters long."],
      validate: {
        validator: function (value) {
          return /^\+?[1-9]\d{1,14}$/.test(value); // Validate phone format
        },
        message: "Phone number must be a valid format.",
      },
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be either Male, Female, or Other.",
      },
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("profiles", profileSchema);
