/* eslint-disable no-unused-vars */
const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address: {
    type: String,
  },
  recipient_name: {
    type: String,
  },
  recipient_phone: {
    type: String,
  },
  type: {
    type: String,
    enum: ["Home", "Office", "Other"],
  },
  is_default: {
    type: Boolean,
  },
});

const customerSchema = new Schema(
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
    addresses: [addressSchema],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

const Customer = model("customers", customerSchema);

module.exports = Customer;
