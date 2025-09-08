import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  email: string;
  otp?: string;
  otpExpiry?: Date;
  restaurantName?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

const vendorSchema = new Schema<IVendor>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otp: String,
    otpExpiry: Date,
    restaurantName: String,
    phone: String,
    address: String,
    description: String,
    logo: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent model overwrite in dev mode
const Vendor = mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', vendorSchema);
export default Vendor;
