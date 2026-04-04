const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
});

const validateRegistration = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ message: "Validation Error", errors: err.errors });
  }
};

module.exports = { validateRegistration };
