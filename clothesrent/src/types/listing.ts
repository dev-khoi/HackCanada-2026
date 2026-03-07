export type ListingStatus = "Draft" | "Live" | "Paused" | "Sold";

export interface ImageTransformations {
  removeBg: boolean;
  replaceBg: string | null;
  smartCrop: boolean;
  badge: string | null;
  badgeColor: string;
}

export const DEFAULT_TRANSFORMATIONS: ImageTransformations = {
  removeBg: false,
  replaceBg: null,
  smartCrop: true,
  badge: null,
  badgeColor: "e74c3c",
};

export interface Listing {
  _id: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  description: string;
  price: number;
  dailyRate: number;
  cloudinaryUrl: string;
  publicId: string;
  tags: string[];
  location?: string;
  bbLink?: string;
  status: ListingStatus;
  transformations: ImageTransformations;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  purchaseDate: string;
  cloudinaryUrl: string;
  title: string;
  price: number;
  tags: string[];
}

export interface UploadImageResponse {
  url: string;
  publicId: string;
  tags: string[];
}

export interface CreateListingBody {
  sellerId?: string;
  sellerName?: string;
  title: string;
  description: string;
  price: number;
  dailyRate?: number;
  tags?: string[];
  location?: string;
  cloudinaryUrl: string;
  publicId: string;
  autoTags?: string[];
  transformations: ImageTransformations;
}

export interface CreateListingResponse {
  success: boolean;
  item: Listing;
}

export interface PurchaseResponse {
  success: boolean;
  purchase: {
    purchaseId: string;
    itemId: string;
    buyerId: string;
    title: string;
    price: number;
    cloudinaryUrl: string;
    purchaseDate: string;
  };
}
