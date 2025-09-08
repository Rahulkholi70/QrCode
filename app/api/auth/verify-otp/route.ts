import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    await connectDB();

    const vendor = await Vendor.findOne({ email });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    if (
      vendor.otp !== otp ||   
      !vendor.otpExpiry ||
      new Date(vendor.otpExpiry) < new Date()
    ) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // OTP is valid — remove it
    vendor.otp = undefined;
    vendor.otpExpiry = undefined;
    await vendor.save();

    // Create JWT token
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const token = jwt.sign(
      { email: vendor.email, id: vendor.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in cookie
    const response = NextResponse.json({ message: 'OTP verified', token });
    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
