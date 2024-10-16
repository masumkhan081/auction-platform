const { Schema, model, default: mongoose } = require("mongoose");
// 
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['ADMIN', 'SELLER', 'BIDDER'],
        message: 'Role must be either ADMIN, SELLER, or BIDDER',
      },
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Profile ID is required'],
      ref: 'Profile', // assuming there's a 'Profile' model
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

module.exports = model("users", userSchema);
