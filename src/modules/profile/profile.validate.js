const { z } = require("zod");
const Profile = require("./profile.model");

const profileCreateSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Full name is required." })
    .max(100, { message: "Full name must be at most 100 characters long." }),

  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 characters long." })
    .max(15, { message: "Phone number must be at most 15 characters long." })
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: "Phone number must be a valid format.",
    }),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
});

const profileUpdateSchema = profileCreateSchema.partial();

async function checkIfPhoneIsUnique(phone) {
  const isExist = await Profile.findOne({ phone });
  return isExist ? false : true;
}

module.exports = { profileCreateSchema, profileUpdateSchema };
