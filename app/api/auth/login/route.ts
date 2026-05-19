import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'aura-connect-jwt-secret-key-super-secure';

// Login schema validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // 2. Lookup User
    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // 3. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 5. Store JWT in HTTP-Only Cookie
    const cookieStore = await cookies();
    cookieStore.set('aura_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      message: 'Login successful'
    }, { status: 200 });

  } catch (err) {
    console.error('[API Auth Login] Error:', err);
    return NextResponse.json({
      message: 'Internal server error occurred during login.'
    }, { status: 500 });
  }
}
