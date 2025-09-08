import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IAnalytics extends Document {
  vendorId: mongoose.Types.ObjectId;
  restaurantName: string;
  eventType: 'scan' | 'visit' | 'menu_view' | 'item_view';
  ipHash?: string; // Hashed IP address for privacy
  userAgentHash?: string; // Hashed user agent for privacy
  referrer?: string;
  timestamp: Date;
  metadata?: {
    itemId?: string;
    itemName?: string;
    scanSource?: string;
  };
}

// Helper function to hash sensitive data
const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

const analyticsSchema = new Schema<IAnalytics>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    restaurantName: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ['scan', 'visit', 'menu_view', 'item_view'],
      required: true,
    },
    ipHash: String, // Hashed IP address for privacy
    userAgentHash: String, // Hashed user agent for privacy
    referrer: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      itemId: String,
      itemName: String,
      scanSource: String,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
analyticsSchema.index({ vendorId: 1, timestamp: -1 });
analyticsSchema.index({ restaurantName: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });

// Prevent model overwrite in dev mode
const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
