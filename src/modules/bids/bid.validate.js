const { z } = require("zod");

const bidSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Category name must be at least 3 characters long" })
    .max(50, { message: "Category name cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9\s]+$/, {
      message:
        "Category name is not valid! Only letters, numbers, and spaces are allowed.",
    }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
});

module.exports = { bidSchema };
