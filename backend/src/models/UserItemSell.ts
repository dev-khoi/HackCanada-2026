import mongoose, { Schema } from "mongoose";
import { IUserItemSell } from "../types";

const TransformationsSchema = new Schema(
  {
    removeBg: { type: Boolean, default: false },
    replaceBg: { type: String, default: null },
    smartCrop: { type: Boolean, default: true },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: "e74c3c" },
  },
  { _id: false }
);

const UserItemSellSchema = new Schema<IUserItemSell>(
  {
    sellerId: { type: String, default: "" },
    sellerName: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    dailyRate: { type: Number, default: 0 },
    location: { type: String, default: "" },
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    tags: { type: [String], default: [] },
    bbLink: { type: String },
    status: {
      type: String,
      enum: ["Draft", "Live", "Paused", "Sold"],
      default: "Live",
    },
    transformations: {
      type: TransformationsSchema,
      default: () => ({
        removeBg: false,
        replaceBg: null,
        smartCrop: true,
        badge: null,
        badgeColor: "e74c3c",
      }),
    },
    
  },
  { timestamps: true }
);

export default mongoose.model<IUserItemSell>("UserItemSell", UserItemSellSchema);
