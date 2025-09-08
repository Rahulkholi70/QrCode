// ✅ Update for /api/vendor/menu/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';

export async function POST(req: NextRequest) {
  await connectDB();

  const { token, name, price, category, image } = await req.json();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const vendorId = decoded.id;

    const newItem = { name, price, category, image };

    await MenuItem.updateOne(
      { vendorId },
      { $push: { items: newItem } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
  }
}
