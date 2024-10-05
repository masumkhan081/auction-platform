const { z } = require("zod");

// Define a Zod schema for address validation

const profileSchema = z.object({
  firstName: z.string().min(15).max(75),
  lastName: z.string().min(6).max(50),
  phone: z.string().min(11).max(50).optional(),
  address: z.string().min(11).max(50).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
});

module.exports = profileSchema;
