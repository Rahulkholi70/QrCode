import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import MenuItem from '@/models/MenuItem';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const encodedRestaurantName = url.searchParams.get('restaurant');

    if (!encodedRestaurantName) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    // Decode the restaurant name to handle URL encoding
    const restaurantName = decodeURIComponent(encodedRestaurantName);

    await connectDB();

    // Find vendor by restaurantName
    const vendor = await Vendor.findOne({ restaurantName }).select('-otp -otpExpiry -__v');
    if (!vendor) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Find menu items for the vendor
    const menu = await MenuItem.findOne({ vendorId: vendor._id.toString() });
    if (!menu) {
      return NextResponse.json({
        items: [],
        vendor: {
          restaurantName: restaurantName,
          description: vendor.description,
          logo: vendor.logo,
          address: vendor.address,
          phone: vendor.phone,
          discountType: vendor.discountType,
          discountValue: vendor.discountValue
        }
      });
    }

    return NextResponse.json({
      items: menu.items,
      vendor: {
        restaurantName: vendor.restaurantName,
        description: vendor.description,
        logo: vendor.logo,
        address: vendor.address,
        phone: vendor.phone,
        discountType: vendor.discountType,
        discountValue: vendor.discountValue
      }
    });
  } catch (error) {
    console.error('Public menu fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
