const { z } = require('zod');

// Password security regex (Min 6 chars, at least one letter and one number)
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Phone must be at least 10 characters').optional(),
    password: z.string().min(1, 'Password is required')
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
    path: ["email", "phone"]
  }),
});

const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number required'),
    password: z.string().regex(passwordRegex, 'Password must be at least 6 characters and contain both letters and numbers'),
  })
});

const registerDriverSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name is required').optional(),
    name: z.string().min(2, 'Name is required').optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number required'),
    password: z.string().regex(passwordRegex, 'Password must be at least 6 characters, mixed letters and numbers'),
    vehicleType: z.string().optional(),
    vehicleNumber: z.string().optional(),
  })
});

module.exports = {
  loginSchema,
  adminLoginSchema,
  registerUserSchema,
  registerDriverSchema
};
