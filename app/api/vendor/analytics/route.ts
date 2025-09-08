import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Analytics from '@/models/Analytics';
import Vendor from '@/models/Vendor';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Helper function to hash sensitive data
const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find vendor
    const vendor = await Vendor.findOne({ email: decoded.email });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendorId = vendor._id;
    const restaurantName = vendor.restaurantName || 'your-restaurant';

    // Get analytics data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total scans (QR code scans)
    const totalScans = await Analytics.countDocuments({
      vendorId,
      eventType: 'scan',
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Unique visitors (unique hashed IP addresses for visits)
    const uniqueVisitorsResult = await Analytics.aggregate([
      {
        $match: {
          vendorId,
          eventType: 'visit',
          timestamp: { $gte: thirtyDaysAgo },
          ipHash: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$ipHash'
        }
      },
      {
        $count: 'uniqueVisitors'
      }
    ]);

    const uniqueVisitors = uniqueVisitorsResult.length > 0 ? uniqueVisitorsResult[0].uniqueVisitors : 0;

    // Conversion rate (visits that led to menu views)
    const totalVisits = await Analytics.countDocuments({
      vendorId,
      eventType: 'visit',
      timestamp: { $gte: thirtyDaysAgo }
    });

    const menuViews = await Analytics.countDocuments({
      vendorId,
      eventType: 'menu_view',
      timestamp: { $gte: thirtyDaysAgo }
    });

    const conversionRate = totalVisits > 0 ? Math.round((menuViews / totalVisits) * 100) : 0;

    // Recent activity (last 10 events)
    const recentActivity = await Analytics.find({
      vendorId,
      timestamp: { $gte: thirtyDaysAgo }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('eventType timestamp metadata')
    .lean();

    // Daily scan trend for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyScans = await Analytics.aggregate([
      {
        $match: {
          vendorId,
          eventType: 'scan',
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return NextResponse.json({
      totalScans,
      uniqueVisitors,
      conversionRate,
      recentActivity,
      dailyScans,
      period: '30 days'
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to track analytics events
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { eventType, restaurantName, metadata = {} } = body;

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || '';

    // Get referrer
    const referrer = request.headers.get('referer') || '';

    // Find vendor by restaurant name
    const vendor = await Vendor.findOne({ restaurantName });
    if (!vendor) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Create analytics event with hashed sensitive data
    const analyticsEvent = new Analytics({
      vendorId: vendor._id,
      restaurantName,
      eventType,
      ipHash: ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : undefined,
      userAgentHash: userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : undefined,
      referrer,
      metadata
    });

    await analyticsEvent.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
