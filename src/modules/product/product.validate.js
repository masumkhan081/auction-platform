const { z } = require("zod");

// Define the Zod schema for the product
const createProductSchema = z.object({
  productName: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be at most 100 characters long")
    .regex(
      /^[a-zA-Z0-9\s]+$/,
      "Product name can only contain letters, numbers, and spaces"
    ),

  category: z.string().min(1, "Category is required"), // ObjectId as string (or reference)

  productImages: z.array(z.string().url()).optional(), // Array of image URLs (optional)

  productDetail: z
    .string()
    .min(1, "Product detail is required")
    .max(1000, "Product detail must be at most 1000 characters long")
    .regex(
      /^[a-zA-Z0-9\s]+$/,
      "Product detail can only contain letters, numbers, and spaces"
    ),

  approval: z.enum(["APPROVED", "DISAPPROVED", "CANCELLED"]).optional(),

  status: z.enum(["SOLD", "ON_AUCTION", "INACTIVE"]).optional(),

  approvalNote: z
    .string()
    .max(500, "Approval note must be at most 500 characters long")
    .optional(),
});

//

const adminApprovalSchema = z.object({
  approval: z.enum(
    ["APPROVED", "DISAPPROVED", "CANCELLED", "PENDING", "UNDER_REVIEW"],
    {
      required_error: "Approval status is required",
      invalid_type_error: "Approval status must be one of the specified values",
    }
  ),
  approvalNote: z
    .string()
    .max(500, "Approval note must be at most 500 characters long")
    .optional(),
});

module.exports = { createProductSchema, adminApprovalSchema };
