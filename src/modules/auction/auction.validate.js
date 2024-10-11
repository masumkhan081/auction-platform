const { z } = require("zod");
const utcTimezones = require("./enum");

const auctionCreateSchema = z.object({
  product: z.string().nonempty({ message: "Product is required" }), // Assuming product is a string ID
  seller: z.string().nonempty({ message: "Seller is required" }), // Assuming seller is a string ID
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
    .date()
    .refine((date) => !isNaN(date.getTime()), {
      message: "Auction start must be a valid date",
    })
    .nonempty({ message: "Auction start date is required" }),
  auctionEnd: z
    .date()
    .refine((date, ctx) => {
      if (!isNaN(date.getTime()) && date > ctx.parent.auctionStart) {
        return true;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Auction end must be a valid date and after auction start",
      });
      return false;
    })
    .nonempty({ message: "Auction end date is required" }),
  bidIncrement: z
    .number()
    .nonnegative({ message: "Bid increment must be a positive number" })
    .min(0, { message: "Bid increment is required" }),
  isOpen: z.boolean().optional().default(false),
  isSold: z.boolean().optional().default(false),
});

const auctionEditSchema = auctionCreateSchema.partial();

module.exports = { auctionCreateSchema, auctionEditSchema };
