import { apiFetch, apiFormFetch } from "./client";
import type {
  Listing,
  Purchase,
  UploadImageResponse,
  CreateListingBody,
  CreateListingResponse,
  PurchaseResponse,
} from "../types/listing";

export async function uploadImage(
  formData: FormData
): Promise<UploadImageResponse> {
  return apiFormFetch<UploadImageResponse>("/api/upload", formData);
}

export async function fetchListings(status?: string): Promise<Listing[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<Listing[]>(`/api/listings${query}`);
}

export async function fetchListingById(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`);
}

export async function createListing(
  body: CreateListingBody
): Promise<CreateListingResponse> {
  return apiFetch<CreateListingResponse>("/api/listings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateListing(
  id: string,
  data: Partial<Listing>
): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteListing(
  id: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/listings/${id}`, {
    method: "DELETE",
  });
}

export async function purchaseListing(
  id: string,
  buyerId: string
): Promise<PurchaseResponse> {
  return apiFetch<PurchaseResponse>(`/api/listings/${id}/purchase`, {
    method: "POST",
    body: JSON.stringify({ buyerId }),
  });
}

export async function searchListings(query: string): Promise<Listing[]> {
  return apiFetch<Listing[]>("/api/style/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function analyzeStyleImages(
  base64Images: string[]
): Promise<{ descriptions: string[] }> {
  return apiFetch<{ descriptions: string[] }>("/api/style/analyze", {
    method: "POST",
    body: JSON.stringify({ images: base64Images }),
  });
}

export async function recommendFromStyle(
  descriptions: string[]
): Promise<{ recommendations: Listing[] }> {
  return apiFetch<{ recommendations: Listing[] }>("/api/style/recommend", {
    method: "POST",
    body: JSON.stringify({ descriptions }),
  });
}

export async function recommendFromPrompt(
  prompt: string
): Promise<{ recommendations: Listing[] }> {
  return apiFetch<{ recommendations: Listing[] }>("/api/style/recommend", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export interface OutfitItem {
  listingId: string;
  listing: Listing;
  slot: string;
  reason: string;
}

export async function generateOutfit(
  prompt: string
): Promise<{ items: OutfitItem[]; stylistNote: string }> {
  return apiFetch<{ items: OutfitItem[]; stylistNote: string }>(
    "/api/outfit/generate",
    {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }
  );
}

export async function getUserStyle(
  auth0Id: string
): Promise<{ prompt: string; descriptions: string[] }> {
  return apiFetch<{ prompt: string; descriptions: string[] }>(
    `/api/users/${encodeURIComponent(auth0Id)}/style`
  );
}

export interface PublicUserProfile {
  auth0Id: string;
  name: string;
  picture: string;
  location: string;
}

export async function fetchPublicUserProfile(
  auth0Id: string
): Promise<PublicUserProfile> {
  return apiFetch<PublicUserProfile>(
    `/api/users/${encodeURIComponent(auth0Id)}/public`
  );
}

export async function savePublicUserProfile(
  auth0Id: string,
  data: { name?: string; picture?: string; location?: string; email?: string }
): Promise<PublicUserProfile> {
  return apiFetch<PublicUserProfile>(
    `/api/users/${encodeURIComponent(auth0Id)}/public`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function saveUserStyle(
  auth0Id: string,
  data: { prompt?: string; descriptions?: string[] }
): Promise<{ prompt: string; descriptions: string[] }> {
  return apiFetch<{ prompt: string; descriptions: string[] }>(
    `/api/users/${encodeURIComponent(auth0Id)}/style`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function fetchPurchases(): Promise<Purchase[]> {
  return apiFetch<Purchase[]>("/api/purchases");
}
