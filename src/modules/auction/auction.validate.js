const { z } = require("zod");
const utcTimezones = require("./enum"); // Ensure this exports a valid array

const auctionCreateSchema = z.object({
  product: z.string().nonempty({ message: "Product is required" }), // Assuming product is a string ObjectId
  seller: z.string().nonempty({ message: "Seller is required" }), // Assuming seller is a string ObjectId
  timeZone: z.enum(utcTimezones, { message: "Time zone is required" }),
  startPrice: z
    .number()
    .nonnegative({ message: "Start price must be a positive number" })
    .min(0, { message: "Start price is required" }),
  currentPrice: z
    .number()
    .nonnegative({ message: "Current price must be a positive number" })
    .optional()
    .default(0),
  auctionStart: z
    .string()
    .refine((dateStr) => !isNaN(new Date(dateStr).getTime()), {
      message: "Auction start must be a valid date",
    })
    .transform((dateStr) => new Date(dateStr)), // Convert string to Date
  auctionEnd: z
    .string()
    .refine((dateStr) => !isNaN(new Date(dateStr).getTime()), {
      message: "Auction end must be a valid date",
    })
    .transform((dateStr) => new Date(dateStr)), // Convert string to Date
  minBidIncrement: z
    .number()
    .nonnegative({ message: "Bid increment must be a positive number" })
    .min(0, { message: "Bid increment is required" }),
  isOpen: z.boolean().optional().default(false),
  isSold: z.boolean().optional().default(false),
});

// Ensure this is set up correctly
const auctionEditSchema = auctionCreateSchema.omit({ isSold: true }).partial();

const isAuctionEndValid = ({ auctionStart, auctionEnd }) => {
  try {
    if (new Date(auctionEnd) <= new Date(auctionStart)) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    return false;
  }
};

module.exports = { auctionCreateSchema, auctionEditSchema, isAuctionEndValid };
