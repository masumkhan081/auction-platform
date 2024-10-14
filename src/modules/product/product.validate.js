const { z } = require("zod");
const mongoose = require('mongoose');


// 
const createProductSchema = z.object({
  productName: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be at most 100 characters long")
    .regex(
      /^[a-zA-Z0-9\s-_]+$/,
      "Product name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  category: z
    .string()
    .min(1, "Category is required")
    .refine((id) => mongoose.Types.ObjectId.isValid(id), {
      message: "Invalid category ID.",
    }),
  productDetail: z
    .string()
    .min(1, "Product detail is required")
    .max(1000, "Product detail must be at most 1000 characters long")
    .regex(
      /^[a-zA-Z0-9\s-_]+$/,
      "Product detail can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
});
//

const adminApprovalSchema = z.object({
  adminApproval: z
    .enum(["APPROVED", "DISAPPROVED", "CANCELLED", "PENDING"], {
      invalid_type_error: "Approval status must be one of the specified values",
    })
    .optional(),
  reviewNote: z
    .string()
    .max(500, "Approval note must be at most 500 characters long")
    .optional(),
});
//
const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
  adminApprovalSchema,
};
