const { z } = require("zod");
const utcTimezones = require("./enum");

const registerSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .nonempty({ message: "Email is required" }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(20, { message: "Password must be at most 20 characters long" })
    .nonempty({ message: "Password is required" }),

  full_name: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(50, { message: "Full name must be at most 50 characters long" }),

  phone: z
    .string()
    .regex(/^\+\d{1,3}\d{9}$/, {
      message: "Phone number must be in the format: +<country code><9 digits>",
    })
    .nonempty({ message: "Phone number is required" }),

  gender: z.enum(["Male", "Female", "Other"]).optional(),

  address: z.string().optional(),

  timeZone: z
    .string()
    .nonempty({ message: "Time zone is required" })
    .refine((tz) => utcTimezones.includes(tz), {
      message: "Time zone must be one of the valid UTC time zones.",
    }),
});
//
const loginSChema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password must be no more than 20 characters" }),
});
//
const otpVerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  token: z.string().min(15).max(500),
  otp: z.string().min(4).max(6),
});

const emailVerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const resetPassSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password must be no more than 20 characters" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password must be no more than 20 characters" }),
});

module.exports = {
   
  registerSchema,
  loginSChema,
  emailVerSchema,
  resetPassSchema,
  otpVerSchema, 
};
