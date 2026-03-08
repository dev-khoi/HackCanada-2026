import { Document } from "mongoose";

export interface IUser extends Document {
  auth0Id: string;
  email: string;
  username: string;
  picture?: string;
  location?: string;
  backboardProfileRef?: string;
  styleProfileJSON?: object;
}

export interface ImageTransformations {
  removeBg: boolean;
  replaceBg: string | null;
  smartCrop: boolean;
  badge: string | null;
  badgeColor: string;
}

export interface ListingSize {
  letter?: string;
  waist?: string;
  shoe?: string;
}

export interface IUserItemSell extends Document {
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  dailyRate: number;
  location: string;
  cloudinaryUrl: string;
  publicId: string;
  tags: string[];
  bbLink?: string;
  size?: ListingSize;
  status: "Draft" | "Live" | "Paused" | "Sold";
  transformations: ImageTransformations;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserItemBuy extends Document {
  itemId: string;
  buyerId: string;
  sellerId: string;
  purchaseDate: Date;
  cloudinaryUrl: string;
  title: string;
  price: number;
  tags: string[];
}

export interface CreateListingBody {
  sellerId?: string;
  sellerName?: string;
  title: string;
  description: string;
  price: number;
  dailyRate: number;
  location?: string;
  tags?: string[];
  size?: ListingSize;
  cloudinaryUrl?: string;
  publicId?: string;
  autoTags?: string[];
  transformations?: ImageTransformations;
}

export interface PurchaseBody {
  buyerId: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  tags: string[];
}
