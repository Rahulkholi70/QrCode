import mongoose, { Schema, Document } from 'mongoose';

interface IMenu {
  name: string;
  price: number;
  category: string;
  image?: string;
}

export interface IMenuItem extends Document {
  email: string;
  vendorId: string; 
  items: IMenu[];
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    email: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, unique: true }, 
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true },
        image: String,
      },
    ],
  },
  { timestamps: true }
);

const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
export default MenuItem;
