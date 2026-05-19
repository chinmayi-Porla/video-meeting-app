import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('aura_token');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
  } catch (err) {
    console.error('[API Auth Logout] Error:', err);
    return NextResponse.json({
      message: 'Internal server error occurred during logout.'
    }, { status: 500 });
  }
}
