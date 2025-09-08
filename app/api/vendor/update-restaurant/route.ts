import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { token, restaurantName } = await req.json();

    if (!token || !restaurantName) {
      return NextResponse.json({ error: 'Token and restaurant name required' }, { status: 400 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
    await connectDB();

    const updated = await Vendor.findByIdAndUpdate(
      decoded.id,
      { restaurantName },
      { new: true }
    );

    return NextResponse.json({ message: 'Updated successfully', vendor: updated });
    
  } catch (err) {
    console.error('Error updating name:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
