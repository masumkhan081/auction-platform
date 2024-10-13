const { z } = require("zod");

const feedbackPostSchema = z.object({
  auction: z
    .string()
    .nonempty({ message: "Auction reference is required" })
    .refine((id) => id.match(/^[0-9a-fA-F]{24}$/), {
      message: "Invalid auction ObjectId format",
    }),
  reviewer: z
    .string()
    .nonempty({ message: "Reviewer reference is required" })
    .refine((id) => id.match(/^[0-9a-fA-F]{24}$/), {
      message: "Invalid reviewer ObjectId format",
    }),
  reviewText: z
    .string()
    .min(10, { message: "Review text must be at least 10 characters long" })
    .max(500, { message: "Review text must be at most 500 characters long" }),
  rating: z
    .number()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
});

const feedbackPatchSchema = feedbackPostSchema.partial();

module.exports = { feedbackPostSchema, feedbackPatchSchema };
