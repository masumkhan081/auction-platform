const { z } = require("zod");
const { getHashedPassword } = require("../../utils/tokenisation");

// Define a Zod schema for address validation

function isPostBodyValid({ full_name, email, password, role, phone, address }) {
  if (full_name === undefined || full_name === "") {
    return { success: false, message: "Full name is required" };
  } else if (phone === undefined || phone === "") {
    return { success: false, message: "phone number is missing" };
  } else if (password === undefined || password === "") {
    return { success: false, message: "Must provide a valid password" };
  } else {
    return {
      success: true,
      full_name,
      email,
      password,
      role: "CUSTOMER",
      phone,
      addresses: [
        {
          address: address,
        },
      ],
    };
  }
}

const addressSchema = z.object({
  district: z.string().min(1).max(50), //
  sub_district: z.string().min(1).max(50), //
  village: z.string().min(1).max(50).optional(), //
  street: z.string().min(1).max(100).optional(), //
  building: z.string().min(1).max(100).optional(), //
});
//
const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters long" })
    .max(100, { message: "Full name must be no more than 100 characters" })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Full name must contain only letters and spaces",
    }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits long" })
    .max(15, { message: "Phone number must be no more than 15 digits long" })
    .regex(/^\+?[0-9\s()-]+$/, {
      message: "Phone number must contain only digits",
    }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password must be no more than 20 characters" }),
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
  addressSchema,
  registerSchema,
  loginSChema,
  emailVerSchema,
  resetPassSchema,
  otpVerSchema,
  isPostBodyValid,
};
