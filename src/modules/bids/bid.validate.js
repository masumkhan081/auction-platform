const { z } = require("zod");

const bidCreateSchema = z.object({
  auction: z
    .string()
    .nonempty("Auction reference is required")
    .refine(
      (val) => /^[0-9a-fA-F]{24}$/.test(val), // Assuming it's an ObjectId string pattern
      { message: "Invalid auction reference ID" }
    ),

  bidAmount: z.number().min(1, "Bid amount must be positive"),
});

const bidUpdateSchema = z.object({
  bidAmount: z.number().min(1, "Bid amount must be positive"),
});

module.exports = { bidCreateSchema, bidUpdateSchema };
