import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  await connectDB();
  const { token, itemId } = await req.json();

  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const vendorId = decoded.id;

    await MenuItem.updateOne(
      { vendorId },
      { $pull: { items: { _id: itemId } } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized or DB error' }, { status: 400 });
  }
}
