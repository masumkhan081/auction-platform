const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auctions",
      required: [true, "Auction reference is required"],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Reviewer reference is required"],
    },
    reviewText: {
      type: String,
      required: [true, "Review text is required"],
      minlength: [10, "Review text must be at least 10 characters long"],
      maxlength: [500, "Review text must be at most 500 characters long"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
