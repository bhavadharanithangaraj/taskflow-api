// Rules for the register and login request bodies (zod schemas).
const { z } = require('zod');

// Trim and lowercase first, then check the format, so " Me@Mail.com " is accepted as "me@mail.com".
const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Must be a valid email address'));

const registerSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(100),
  email,
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
