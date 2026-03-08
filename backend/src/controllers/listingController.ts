import { Request, Response } from "express";
import UserItemSell from "../models/UserItemSell";
import UserItemBuy from "../models/UserItemBuy";
import User from "../models/User";
import { uploadImage } from "../services/cloudinaryService";
import { generateBBLink } from "../services/backboardService";
import { CreateListingBody, PurchaseBody } from "../types";

async function attachProfileNames<T extends { sellerId?: string; sellerName?: string }>(
  listings: T[]
): Promise<Array<T & { sellerName: string }>> {
  const sellerIds = Array.from(
    new Set(
      listings
        .map((listing) => listing.sellerId?.trim() || "")
        .filter((id) => id.length > 0)
    )
  );

  if (!sellerIds.length) {
    return listings.map((listing) => ({
      ...listing,
      sellerName: listing.sellerName?.trim() || listing.sellerId?.trim() || "",
    }));
  }

  const users = await User.find({ auth0Id: { $in: sellerIds } })
    .select({ auth0Id: 1, username: 1 })
    .lean();
  const namesById = new Map(users.map((user) => [user.auth0Id, user.username?.trim() || ""]));

  return listings.map((listing) => ({
    ...listing,
    sellerName:
      namesById.get(listing.sellerId?.trim() || "") ||
      listing.sellerName?.trim() ||
      listing.sellerId?.trim() ||
      "",
  }));
}

export const getAllListings = async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const filter = statusFilter ? { status: statusFilter } : {};
    const listings = await UserItemSell.find(filter).sort({ createdAt: -1 }).lean();
    const listingsWithNames = await attachProfileNames(listings);
    res.json(listingsWithNames);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listings" });
  }
};

export const getListingById = async (req: Request, res: Response) => {
  try {
    const listing = await UserItemSell.findById(req.params.id).lean();
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    const [listingWithName] = await attachProfileNames([listing]);
    res.json(listingWithName);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
};

export const createListing = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      dailyRate,
      location,
      tags,
      sellerId,
      sellerName,
      cloudinaryUrl: preUploadedUrl,
      publicId: preUploadedPublicId,
      autoTags,
      transformations,
      size,
    } = req.body as CreateListingBody;

    if (!title || !description || price == null || !location?.trim()) {
      res.status(400).json({ error: "title, description, price, and location are required" });
      return;
    }

    let cloudinaryUrl: string;
    let publicId: string;
    let cloudinaryTags: string[] = [];

    if (preUploadedUrl && preUploadedPublicId) {
      // Image was pre-uploaded via POST /api/upload
      cloudinaryUrl = preUploadedUrl;
      publicId = preUploadedPublicId;
      cloudinaryTags = autoTags ?? [];
    } else if (req.file) {
      // Legacy flow: image uploaded with listing creation
      const cloudResult = await uploadImage(req.file.buffer, req.file.originalname);
      cloudinaryUrl = cloudResult.url;
      publicId = cloudResult.publicId;
      cloudinaryTags = cloudResult.tags;
    } else {
      res.status(400).json({ error: "image file or pre-uploaded cloudinaryUrl + publicId required" });
      return;
    }

    // Check for duplicate publicId
    const existing = await UserItemSell.findOne({ publicId });
    if (existing) {
      res.status(409).json({ error: "Duplicate listing for this image" });
      return;
    }

    // Optionally generate Backboard vector link
    const bbLink = await generateBBLink(cloudinaryUrl, title, description);

    // Merge auto-tags from Cloudinary with user-supplied tags
    const mergedTags = [
      ...new Set([...(tags ?? []), ...cloudinaryTags]),
    ];

    const existingUser = sellerId
      ? await User.findOne({ auth0Id: sellerId }).select({ username: 1 }).lean()
      : null;
    const resolvedSellerName =
      existingUser?.username?.trim() || sellerName?.trim() || "";

    if (sellerId && !resolvedSellerName) {
      res.status(400).json({ error: "Please set your profile name before creating a listing" });
      return;
    }

    const listing = new UserItemSell({
      sellerId: sellerId ?? "",
      sellerName: resolvedSellerName,
      title,
      description,
      price,
      dailyRate: dailyRate ?? 0,
      location: location?.trim() ?? "",
      cloudinaryUrl,
      publicId,
      tags: mergedTags,
      bbLink: bbLink || undefined,
      size: size && (size.letter || size.waist || size.shoe) ? size : undefined,
      status: "Live",
      transformations: transformations ?? {
        removeBg: false,
        replaceBg: null,
        smartCrop: true,
        badge: null,
        badgeColor: "e74c3c",
      },
    });

    await listing.save();

    if (sellerId) {
      await User.findOneAndUpdate(
        { auth0Id: sellerId },
        {
          $set: {
            auth0Id: sellerId,
            ...(resolvedSellerName ? { username: resolvedSellerName } : {}),
          },
        },
        { upsert: true }
      );
    }

    res.status(201).json({
      success: true,
      item: {
        itemId: listing._id,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        title: listing.title,
        description: listing.description,
        location: listing.location,
        cloudinaryUrl: listing.cloudinaryUrl,
        publicId: listing.publicId,
        tags: listing.tags,
        bbLink: listing.bbLink,
        status: listing.status,
        transformations: listing.transformations,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      },
    });
  } catch (error: any) {
    const message = error?.message || "Failed to create listing";
    res.status(500).json({ error: message });
  }
};

export const updateListing = async (req: Request, res: Response) => {
  try {
    const listing = await UserItemSell.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: "Failed to update listing" });
  }
};

export const deleteListing = async (req: Request, res: Response) => {
  try {
    const listing = await UserItemSell.findByIdAndDelete(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json({ message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete listing" });
  }
};

export const purchaseListing = async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.body as PurchaseBody;
    if (!buyerId) {
      res.status(400).json({ error: "buyerId is required" });
      return;
    }

    const item = await UserItemSell.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    if (item.status === "Sold") {
      res.status(410).json({ error: "Item is already sold" });
      return;
    }

    if (item.sellerId && item.sellerId === buyerId) {
      res.status(400).json({ error: "Cannot purchase your own listing" });
      return;
    }

    // Create purchase record
    const purchase = new UserItemBuy({
      itemId: item._id,
      buyerId,
      sellerId: item.sellerId,
      purchaseDate: new Date(),
      cloudinaryUrl: item.cloudinaryUrl,
      title: item.title,
      price: item.price,
      tags: item.tags,
    });
    await purchase.save();

    // Mark listing as sold
    item.status = "Sold";
    await item.save();

    res.status(201).json({
      success: true,
      purchase: {
        purchaseId: purchase._id,
        itemId: purchase.itemId,
        buyerId: purchase.buyerId,
        title: purchase.title,
        price: purchase.price,
        cloudinaryUrl: purchase.cloudinaryUrl,
        purchaseDate: purchase.purchaseDate,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Purchase failed" });
  }
};
