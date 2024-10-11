const { Schema, model, default: mongoose } = require("mongoose"); 
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
