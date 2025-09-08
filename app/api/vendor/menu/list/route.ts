// app/api/vendor/menu/list/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';

export async function GET(req: Request) {
  await connectDB();

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const vendorId = decoded.id;

    const vendorMenu = await MenuItem.findOne({ vendorId });

    return NextResponse.json({
      success: true,
      items: vendorMenu?.items || [],
    });
  } catch (err) {
    console.error("❌ Menu list API error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid Token or Server Error' }, { status: 401 });
  }
}
