import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }     

    await connectDB();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiry: 10 minutes
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert vendor with OTP
    await Vendor.findOneAndUpdate(
      { email },
      { email, otp, otpExpiry },
      { upsert: true, new: true }
    );

    // Setup nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    // Send email   
    await transporter.sendMail({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Your OTP for QRScan Login',
      html: `<p>  Your OTP is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    });

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
