import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

// Zod Schema for strong passwords
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Signup schema validation
const signupSchema = z.object({
  name: z.string().min(1, 'Full name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // 2. Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({
        errors: { email: ['A user with this email already exists'] }
      }, { status: 400 });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Store user securely
    const user = await db.createUser(name, email, passwordHash);
    if (!user) {
      return NextResponse.json({
        message: 'Could not write user to database.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!'
    }, { status: 201 });

  } catch (err) {
    console.error('[API Auth Signup] Error:', err);
    return NextResponse.json({
      message: 'Internal server error occurred during signup.'
    }, { status: 500 });
  }
}
