const { Schema, model, default: mongoose } = require("mongoose");
const utcTimezones = require("./enum");
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "SELLER", "BIDDER"],
    },
    timeZone: {
      type: String,
      enum: utcTimezones,
    },
    is_verified: { type: Boolean, default: false },
    is_active: { type: Boolean, default: false },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("users", userSchema);
