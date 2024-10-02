/* eslint-disable no-unused-vars */
const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const profile_schema = new Schema(
  {
    full_name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    profile: { type: String },
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

const Profile = model("seller_profiles", profile_schema);

module.exports = Profile;
