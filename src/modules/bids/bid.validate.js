const { z } = require("zod");

const bidSchema = z.object({
  auction: z
    .string()
    .nonempty("Auction reference is required")
    .refine(
      (val) => /^[0-9a-fA-F]{24}$/.test(val), // Assuming it's an ObjectId string pattern
      { message: "Invalid auction reference ID" }
    ),

  bidder: z
    .string()
    .nonempty("Bidder reference is required")
    .refine(
      (val) => /^[0-9a-fA-F]{24}$/.test(val), // Assuming it's an ObjectId string pattern
      { message: "Invalid bidder reference ID" }
    ),

  bidAmount: z
    .number()
    .min(1, "Bid amount must be at least 1")
    .positive("Bid amount must be a positive number"),

  bidTime: z.date().default(() => new Date()),

  isWinner: z.boolean().default(false),
});

module.exports = { bidSchema };
