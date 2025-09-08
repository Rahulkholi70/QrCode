import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Vendor, { IVendor } from '@/models/Vendor';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { email: string };

    await connectDB();

    const vendor = await Vendor.findOne({ email: decoded.email }).select('-otp -otpExpiry');
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { email: string; id: string };

    await connectDB();

    const { restaurantName, phone, address, description, logo, discountType, discountValue } = await req.json();

    const updateData: Partial<Pick<IVendor, 'restaurantName' | 'phone' | 'address' | 'description' | 'logo' | 'discountType' | 'discountValue'>> = {};
    if (restaurantName !== undefined) updateData.restaurantName = restaurantName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;

    const vendor = await Vendor.findOneAndUpdate(
      { email: decoded.email },
      { $set: updateData },
      { new: true }
    ).select('-otp -otpExpiry');

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ vendor, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
