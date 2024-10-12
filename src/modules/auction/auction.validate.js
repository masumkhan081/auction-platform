const { z } = require("zod");
const moment = require("moment-timezone");
const { timeZoneEnum } = require("./enum"); // Ensure this exports a valid array
//
const statusEnum = z.enum(["OPEN", "UNSOLD", "PENDING", "SOLD"]);

//
const auctionCreateSchema = z.object({
  product: z.string().nonempty({ message: "Product is required" }), // Assuming product is a string ObjectId
  timeZone: z.enum(timeZoneEnum, { message: "Time zone is required" }),
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
  startPrice: z
    .number()
    .nonnegative({ message: "Start price must be a positive number" })
    .min(0, { message: "Start price is required" }),
 threshold: z
    .number()
    .positive({ message: "Threshold must be a positive number and non-zero" }),
  minBidIncrement: z
    .number()
    .nonnegative({ message: "Bid increment must be a positive number" })
    .min(0, { message: "Bid increment is required" }),
});

// Ensure this is set up correctly
const auctionEditSchema = auctionCreateSchema.partial();

const validateAndConvertToUTC = ({ auctionStart, auctionEnd, timeZone }) => {
  try {
    // Convert auctionStart and auctionEnd to Date objects
    const startDate = new Date(auctionStart);
    const endDate = new Date(auctionEnd);

    // Check if the auction start time is in the past
    if (startDate <= new Date()) {
      return {
        success: false,
        message: "The auction start time must be set for the future.",
      };
    }

    // Ensure the auction end time is after the start time
    if (endDate <= startDate) {
      return {
        success: false,
        message: "The auction end time must come after the start time.",
      };
    }

    // If both checks pass, convert the times to UTC format
    return {
      success: true,
      message: "",
      auctionStart: moment.tz(auctionStart, timeZone).utc().format(),
      auctionEnd: moment.tz(auctionEnd, timeZone).utc().format(),
    };
  } catch (error) {
    // Handle any unexpected errors that may occur during validation
    return {
      success: false,
      message: "There was an error validating the auction times.",
    };
  }
};

module.exports = {
  auctionCreateSchema,
  auctionEditSchema,
  validateAndConvertToUTC,
};
