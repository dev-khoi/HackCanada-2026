NEVER CHANGE THIS: always update the readme in the corresponding folders, or the main folder so that you can reflect what have beenc hagend
for now you dont need the auth middleware

Below is the same system adapted to Express + TypeScript.

1. Architecture Overview
Frontend
(Vite + React)
      │
      │ Auth0 login
      ▼
Express API (TypeScript)
      │
 ┌────┼───────────────────────┐
 │    │                       │
 ▼    ▼                       ▼

Gemini API     Cloudinary     Backboard

      │
      ▼

MongoDB
(Mongoose Models)

Technologies involved:

Express.js

TypeScript

MongoDB

Mongoose

Auth0

Cloudinary

Google Gemini

2. Backend Folder Structure

Recommended structure:

backend/
│
├── src/
│   ├── config/
│   │     database.ts
│   │     cloudinary.ts
│   │
│   ├── controllers/
│   │     authController.ts
│   │     listingController.ts
│   │     styleController.ts
│   │
│   ├── middleware/
│   │     authMiddleware.ts
│   │
│   ├── models/
│   │     User.ts
│   │     Listing.ts
│   │
│   ├── routes/
│   │     authRoutes.ts
│   │     listingRoutes.ts
│   │     styleRoutes.ts
│   │
│   ├── services/
│   │     geminiService.ts
│   │     cloudinaryService.ts
│   │     backboardService.ts
│   │
│   ├── types/
│   │     index.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tsconfig.json
└── package.json
3. TypeScript Setup

Install dependencies:

npm install express mongoose cors dotenv
npm install @types/express @types/node typescript ts-node-dev

Initialize TypeScript:

npx tsc --init

Example tsconfig.json key settings:

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
4. Express Server (TypeScript)
server.ts
import app from "./app";
import mongoose from "mongoose";

const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI as string)
.then(() => {
  console.log("MongoDB connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
app.ts
import express from "express";
import cors from "cors";

import listingRoutes from "./routes/listingRoutes";
import styleRoutes from "./routes/styleRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/listings", listingRoutes);
app.use("/api/style", styleRoutes);

export default app;
5. MongoDB Models (Mongoose + TypeScript)
User Model
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  auth0Id: string;
  email: string;
  username: string;
  backboardProfileRef?: string;
  styleProfileJSON?: object;
}

const UserSchema = new Schema<IUser>({
  auth0Id: { type: String, required: true },
  email: String,
  username: String,
  backboardProfileRef: String,
  styleProfileJSON: Object
});

export default mongoose.model<IUser>("User", UserSchema);
Listing Model
import mongoose, { Schema, Document } from "mongoose";

export interface IListing extends Document {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  cloudinaryTags: string[];
  geminiKeywords: string[];
}

const ListingSchema = new Schema<IListing>({
  sellerId: String,
  title: String,
  description: String,
  price: Number,
  images: [String],
  cloudinaryTags: [String],
  geminiKeywords: [String]
});

export default mongoose.model<IListing>("Listing", ListingSchema);
6. Auth0 Middleware

Backend verifies JWT from the frontend.

import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

export const authMiddleware = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: "https://YOUR_AUTH0_DOMAIN/.well-known/jwks.json",
    cache: true,
    rateLimit: true
  }),
  audience: "fitboard-api",
  issuer: "https://YOUR_AUTH0_DOMAIN/",
  algorithms: ["RS256"]
});

Use in routes:

router.post("/create", authMiddleware, createListing);
7. Seller Upload Flow (Express + TypeScript)

Controller example.

listingController.ts
import { Request, Response } from "express";
import Listing from "../models/Listing";

export const createListing = async (req: Request, res: Response) => {
  try {

    const { description, price, images, keywords } = req.body;

    const listing = new Listing({
      sellerId: (req as any).auth.sub,
      description,
      price,
      images,
      geminiKeywords: keywords
    });

    await listing.save();

    res.json(listing);

  } catch (error) {
    res.status(500).json({ error: "Failed to create listing" });
  }
};
8. Buyer Style Search Flow
User query
"minimalist oversized hoodie"

Frontend
     │
POST /api/search
     │
Backend
     │
Get user Backboard profile
     │
Query Backboard vector engine
     │
Return ranked listing IDs
     │
MongoDB fetch listings
     │
Return results
9. Gemini Service Layer

Example abstraction.

geminiService.ts
export async function analyzeStyle(images: string[]) {

  const response = await fetch("GEMINI_API_URL", {
    method: "POST",
    body: JSON.stringify({
      images
    })
  });

  return response.json();
}
10. Final Stack

Frontend

React

Vite

Auth0

Backend

Node.js

Express.js

TypeScript

Database

MongoDB

Mongoose

External Services

Cloudinary

Google Gemini

Backboard.io