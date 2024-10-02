/* eslint-disable no-unused-vars */
const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const profile_schema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
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

const Profile = model("profiles", profile_schema);

module.exports = Profile;
