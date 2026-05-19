import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const deleteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    // Validate request body
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        errors: parsed.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email } = parsed.data;

    // Delete user from database
    const success = await db.deleteUser(email);

    if (!success) {
      return NextResponse.json({ 
        message: 'User not found or could not be deleted.' 
      }, { status: 404 });
    }

    // Clear authentication cookie (if used)
    const response = NextResponse.json({ 
      success: true, 
      message: 'Account permanently deleted' 
    }, { status: 200 });
    
    response.cookies.set({
      name: 'aura_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[API] Delete Account Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error occurred during account deletion.' 
    }, { status: 500 });
  }
}
