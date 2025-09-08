// app/api/vendor/menu/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { oldName, name, price } = await req.json();

    if (!oldName || !name || !price) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    const vendorId = decoded.id;

    // Use oldName for filtering, update to new name and price
    const result = await MenuItem.updateOne(
      { vendorId },
      {
        $set: {
          'items.$[elem].name': name,
          'items.$[elem].price': price
        }
      },
      {
        arrayFilters: [{ 'elem.name': oldName }]
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error('Error updating item:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
