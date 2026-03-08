# ClothesRent Backend

## Recent Updates (March 7–8, 2026)

- **Railway / CORS**: Added `backend/Dockerfile` so the app runs as `node dist/server.js` instead of `npm start`, fixing SIGTERM and container stops. Server listens on `0.0.0.0`. CORS already allows threadify.pages.dev; 502 was from the backend stopping—see Deployment section below.
- Added root health compatibility routes: `GET /` and `GET /health` now return 200 for platform healthchecks.
- CORS now supports `https://threadify.pages.dev`, Cloudflare preview domains (`*.pages.dev`), and comma-separated `CORS_ORIGINS` from environment variables.
- CORS supports wildcard `*` in `CORS_ORIGINS` and `CORS_ALLOW_ALL=true` for temporary fail-open debugging.
- CORS now includes `https://threadify.pages.dev` in the backend allowed origins list.
- UserItemSell now stores sellerName in addition to sellerId so listing cards can show creator names.
- POST /api/listings now accepts optional sellerName and persists it.
- Added public profile endpoints: GET /api/users/:auth0Id/public and PUT /api/users/:auth0Id/public.
- users documents now include optional picture and location fields.
- Listing and style-search responses now resolve `sellerName` from the user profile (`users.username`) so Thrift Out always shows the profile name.
- Listing creation now rejects requests without a profile name (`users.username`) for authenticated sellers.

Express + TypeScript REST API powering the ClothesRent platform — a peer-to-peer clothing rental & resale marketplace.

---

## Architecture Overview

```
Frontend (Vite + React)
        │
        │  Auth0 login
        ▼
  Express API (TypeScript)
        │
  ┌─────┼────────────────────────┐
  │     │                        │
  ▼     ▼                        ▼
Gemini API    Cloudinary      Backboard.io
                │
                ▼
            MongoDB
       (Mongoose Models)
```

---

## Tech Stack

| Layer             | Technology                      |
| ----------------- | ------------------------------- |
| Runtime           | Node.js                         |
| Framework         | Express.js                      |
| Language          | TypeScript                      |
| Database          | MongoDB Atlas (Mongoose ODM)    |
| Image Hosting     | Cloudinary (server-side upload) |
| AI Style Analysis | Google Gemini API               |
| Vector Search     | Backboard.io                    |
| File Upload       | Multer (memory storage)         |

---

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts            # Mongoose connection
│   │   └── cloudinary.ts          # Cloudinary SDK v2 init
│   │
│   ├── controllers/
│   │   ├── listingController.ts   # Seller listing CRUD + purchase (dual-mode: file or pre-uploaded)
│   │   ├── uploadController.ts    # Image-only upload endpoint
│   │   └── styleController.ts     # AI style analysis + search
│   │
│   ├── middleware/
│   │   └── authMiddleware.ts      # Auth0 JWT (reserved, not active)
│   │
│   ├── models/
│   │   ├── User.ts                # User schema
│   │   ├── UserItemSell.ts        # Seller listing schema
│   │   ├── UserItemBuy.ts         # Purchase record schema
│   │   └── Listing.ts             # Legacy (kept for reference)
│   │
│   ├── routes/
│   │   ├── listingRoutes.ts       # /api/listings (with multer)
│   │   ├── uploadRoutes.ts        # /api/upload (image-only upload)
│   │   └── styleRoutes.ts         # /api/style
│   │
│   ├── services/
│   │   ├── cloudinaryService.ts   # Server-side image upload + Gemini AI tagging
│   │   ├── geminiService.ts       # Google Gemini AI: analyzeStyle + extractImageTags
│   │   └── backboardService.ts    # Vector search + link gen (stub)
│   │
│   ├── types/
│   │   └── index.ts               # All TypeScript interfaces
│   │
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Entry point
│
├── .env                           # Environment variables (NOT committed)
├── .gitignore
├── package.json
├── tsconfig.json
├── toImplement.md                 # Full spec document
└── README.md
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** cluster ([cloud.mongodb.com](https://cloud.mongodb.com))
- **Cloudinary** account ([cloudinary.com](https://cloudinary.com))
- (Optional) Google Gemini API key
- (Optional) Backboard.io account

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional — Google Gemini AI
GEMINI_API_URL=https://generativelanguage.googleapis.com/...
GEMINI_API_KEY=your_gemini_key

# Optional - extra allowed CORS origins (comma-separated)
CORS_ORIGINS=https://threadify.pages.dev,https://your-custom-domain.com

# Optional - temporary debugging switch (allows all origins)
CORS_ALLOW_ALL=false
```

> **Note:** If your MongoDB password contains special characters, URL-encode them. Example: `p@ss!word` → `p%40ss%21word`

### 3. MongoDB Atlas network access

In your Atlas dashboard → **Network Access** → add `0.0.0.0/0` to allow connections from any IP (or restrict to your server IP in production).

---

## Running the Server

### Development (hot-reload)

```bash
npm run dev
```

### Production build

```bash
npm run build    # TypeScript → dist/
npm start        # node dist/server.js
```

---

## Deployment

### Railway (recommended)

The backend includes a **Dockerfile** so the process runs as `node dist/server.js` instead of `npm start`. This ensures the Node process receives SIGTERM correctly when Railway stops the container (npm does not forward signals).

1. **Deploy from repo**: Connect the `backend/` directory (or monorepo root with root set to `backend`) to Railway.
2. **Use Docker**: Railway will detect the Dockerfile and build/run the image. Ensure **Root Directory** is set to `backend` if the repo root is the repo root.
3. **Environment variables**: Set in Railway dashboard:
   - `MONGO_URI` (required)
   - `PORT` (Railway sets this automatically; the app uses it)
   - `CLOUDINARY_*`, `GEMINI_*`, etc. as needed
   - Optional: `CORS_ORIGINS` (comma-separated), `CORS_ALLOW_ALL=true` for debugging
4. **Health check**: In Railway service settings, set the **Health Check Path** to `/health` (or `/`). The app listens on `0.0.0.0` and exposes `GET /`, `GET /health`, and `GET /api/health` returning 200.

If you see "Stopping Container" and "npm error signal SIGTERM" in logs, use a **Custom Start Command** in Railway: `node dist/server.js` (so Node receives SIGTERM). The server now **listens immediately** before MongoDB connects so Railway's health check gets 200 and doesn't kill the container. If the container stops after ~15s and you see "Received SIGTERM", Railway may be replacing it with a new deployment — check the Deployments tab for a newer Active deployment and test your backend /health URL in a browser; if it returns 200, the current deployment is up. Use backend/railway.toml to set healthcheckPath and healthcheckTimeout if needed.

### Render

Use these settings when creating a **Web Service** for the backend (monorepo: backend lives in `backend/`).

| Setting | Value |
|--------|--------|
| **Root Directory** | `backend` |
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/server.js` |
| **Health Check Path** | `/health` |

**Environment variables** (Dashboard → Environment):

- `MONGO_URI` — **required** (MongoDB connection string)
- `PORT` — set by Render (default 10000); app uses it automatically
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — for uploads
- `GEMINI_API_KEY` — optional, for style analysis
- `CORS_ORIGINS` — optional; e.g. `https://threadify.pages.dev` (app already allows `threadify.pages.dev` and `*.pages.dev`)

The app binds to `0.0.0.0` and uses `process.env.PORT`, so no extra config is needed. Optional: use a **Blueprint** — add `render.yaml` at the repo root (see project root) and in Render choose **New → Blueprint**, then connect the repo; Render will create the service with the above settings and prompt for `MONGO_URI`.

### Cloudflare Pages (frontend)

Set the build-time variable so the frontend talks to your backend:

- **Variable name**: `VITE_API_URL`
- **Value**: Your backend base URL, e.g. `https://your-app.onrender.com` or your Railway URL

No trailing slash. Rebuild the frontend after changing this.

---

## User Flows

### Seller Upload Flow (Two-Phase Interactive)

```
Phase 1 — Upload Image
  Seller selects garment photo on frontend
        │
        │  multipart/form-data: image
        ▼
  POST /api/upload
        │
        ├── Upload image to Cloudinary → get cloudinaryUrl + publicId
        │
        ├── Analyze image with Google Gemini AI:
        │   Extract 5-8 fashion-relevant tags (item type, color, style, material)
        │
        ├── Merge Gemini tags with Cloudinary auto-tags (if any)
        │
        ▼
  Return { url, publicId, tags: [...] }
        │
        │  (Frontend stores tags for next phase)
        ▼
Phase 2 — Enhance & Publish
  Seller previews AI transformations (live Cloudinary URL preview)
        │  Toggle: Remove BG, Replace BG, Smart Crop, Badge
        │
  Seller fills in title, description, price, tags, and location
        │
        │  JSON body: cloudinaryUrl, publicId, autoTags, title, description, price, tags, location, transformations
        ▼
  POST /api/listings
        │
        ├── Validate required fields (title, description, price, location, cloudinaryUrl)
        ├── Check for duplicate publicId
        ├── Merge auto-tags with user tags
        ├── Store transformation preferences
        ├── Save UserItemSell document to MongoDB
        │
        ▼
  Return { success: true, item: { ... } }
```

### Buyer Browse & Purchase Flow

```
Buyer browses listings
        │
  GET /api/listings?status=Live
        │
        ▼
  Returns all live UserItemSell documents
        │
  Buyer selects an item
        │
  POST /api/listings/:id/purchase   { buyerId: "..." }
        │
        ├── Validate buyerId is provided
        ├── Check item exists and is not already sold
        ├── Prevent self-purchase (buyer ≠ seller)
        ├── Create UserItemBuy record
        ├── Mark UserItemSell status → "Sold"
        │
        ▼
  Return { success: true, purchase: { ... } }
```

### Style Search Flow

```
Buyer enters style query: "minimalist oversized hoodie"
        │
  POST /api/style/search   { query: "minimalist oversized hoodie" }
        │
        ├── Query Backboard.io vector engine
        │   (returns ranked listing IDs)
        │
        ├── If Backboard returns results → fetch from MongoDB
        ├── If no results → fallback to MongoDB regex search
        │   (searches title, description, tags)
        │
        ▼
  Return array of matching UserItemSell documents
```

---

## API Reference

Base URL: `http://localhost:5000`

### Health Check

| Method | Endpoint      | Description                  |
| ------ | ------------- | ---------------------------- |
| GET    | `/api/health` | Returns `{ "status": "ok" }` |

---

### Upload — `/api/upload`

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| POST | `/api/upload` | `multipart/form-data` | Upload image to Cloudinary (returns URL + publicId + auto-tags) |

#### POST `/api/upload` — Upload Image Only

Send as **multipart/form-data**:

| Field   | Type | Required | Description                 |
| ------- | ---- | -------- | --------------------------- |
| `image` | File | ✅       | Image file (jpg, png, webp) |

#### Response — Upload Success

```json
{
  "url": "https://res.cloudinary.com/dj3drywnu/image/upload/v123/clothesrent/abc123.jpg",
  "publicId": "clothesrent/abc123",
  "tags": ["blazer", "navy", "wool", "minimalist", "tailored", "menswear"]
}
```

**Tags** are automatically extracted by Google Gemini AI during upload:

- Analyzes the garment in the image
- Returns 5-8 relevant fashion tags (item type, color, style, material, aesthetic)
- Includes both Gemini tags + any Cloudinary auto-tags
- Gracefully degrades if Gemini is unavailable (upload still succeeds with Cloudinary-only tags)

---

### Location`r`n`r`n| Method | Endpoint | Query | Description |`r`n|--------|----------|-------|-------------|`r`n| GET | `/api/location/suggest` | `?q=toronto` | Address autocomplete suggestions (server-side geocoder proxy) |`r`n`r`n---`r`n`r`n### Listings — `/api/listings`

| Method | Endpoint | Body / Query | Description |
| --- | --- | --- | --- |
| GET | `/api/listings` | `?status=Live` (optional) | Get all listings, newest first |
| GET | `/api/listings/:id` | — | Get single listing by ID |
| POST | `/api/listings` | `multipart/form-data` | Create listing (upload image) |
| PUT | `/api/listings/:id` | JSON body | Update listing fields |
| DELETE | `/api/listings/:id` | — | Delete a listing |
| POST | `/api/listings/:id/purchase` | `{ "buyerId": "..." }` | Purchase an item |

#### POST `/api/listings` — Create Listing (Dual-Mode)

**Mode 1: Pre-uploaded image (recommended)** — Send as JSON:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cloudinaryUrl` | string | ✅ | Pre-uploaded Cloudinary URL (from `POST /api/upload`) |
| `publicId` | string | ✅ | Cloudinary public ID |
| `autoTags` | string[] | No | Auto-tags from upload response |
| `title` | string | ✅ | Item title |
| `description` | string | ✅ | Item description |
| `price` | number | ✅ | Listing price |
| `dailyRate` | number | No | Daily rental rate |
| `location` | string | ? | Pickup address for this listing |
| `tags` | string[] | No | User-supplied tags |
| `sellerId` | string | No | Seller identifier (Auth0 user.sub) |
| `transformations` | object | No | Cloudinary AI transform preferences |

**`transformations` object:**

```json
{
  "removeBg": false,
  "replaceBg": null,
  "smartCrop": true,
  "badge": "NEW",
  "badgeColor": "e74c3c"
}
```

**Mode 2: File upload (legacy)** — Send as `multipart/form-data`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | ✅ | Image file (jpg, png, webp) |
| `title` | string | ✅ | Item title |
| `description` | string | ✅ | Item description |
| `price` | number | ✅ | Listing price |
| `dailyRate` | number | No | Daily rental rate |
| `location` | string | ? | Pickup address for this listing |
| `tags[]` | string[] | No | User-supplied tags |
| `sellerId` | string | No | Seller identifier |

#### Response — Seller Upload Success

```json
{
  "success": true,
  "item": {
    "itemId": "64f123abc456",
    "sellerId": "auth0|abc123",
    "title": "Obsidian Trench",
    "description": "Minimalist oversized trench coat",
    "location": "100 Queen St W, Toronto",
    "cloudinaryUrl": "https://res.cloudinary.com/xyz/image/upload/clothesrent/abc123.jpg",
    "publicId": "clothesrent/abc123",
    "tags": ["trench", "outerwear", "minimalist"],
    "bbLink": "https://bb.io/v/abc123",
    "status": "Live",
    "createdAt": "2026-03-07T12:00:00.000Z",
    "updatedAt": "2026-03-07T12:00:00.000Z"
  }
}
```

#### POST `/api/listings/:id/purchase` — Purchase Item

```json
{
  "buyerId": "auth0|buyer456"
}
```

#### Response — Purchase Success

```json
{
  "success": true,
  "purchase": {
    "purchaseId": "64f789def012",
    "itemId": "64f123abc456",
    "buyerId": "auth0|buyer456",
    "title": "Obsidian Trench",
    "price": 485,
    "cloudinaryUrl": "https://res.cloudinary.com/xyz/image/upload/clothesrent/abc123.jpg",
    "purchaseDate": "2026-03-07T13:00:00.000Z"
  }
}
```

---

### Style — `/api/style`

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| POST | `/api/style/analyze` | `{ "images": ["url1", "url2"] }` | Analyze images with Gemini AI |
| POST | `/api/style/search` | `{ "query": "minimalist hoodie" }` | Search listings by style |

#### POST `/api/style/search` — Response

Returns array of `UserItemSell` documents matching the style query:

```json
[
  {
    "_id": "64f123abc456",
    "title": "Obsidian Trench",
    "description": "Minimalist oversized trench coat",
    "location": "100 Queen St W, Toronto",
    "cloudinaryUrl": "https://...",
    "tags": ["trench", "outerwear"],
    "price": 485,
    "status": "Live",
    ...
  }
]
```

---

## MongoDB Collections

### `useritemsells` (UserItemSell)

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `sellerId` | String | No | `""` | Auth0 ID or user identifier |
| `title` | String | ✅ | — | Item title |
| `description` | String | ✅ | — | Item description |
| `price` | Number | ✅ | — | Sale/rental price |
| `dailyRate` | Number | No | `0` | Daily rental rate |
| `location` | String | ? | � | Pickup address for this listing |
| `cloudinaryUrl` | String | ✅ | — | Cloudinary secure URL |
| `publicId` | String | ✅ | — | Cloudinary public ID (unique) |
| `tags` | String[] | No | `[]` | Combined user + auto tags |
| `bbLink` | String | No | — | Backboard vector search link |
| `status` | String | No | `"Live"` | `Draft` \| `Live` \| `Paused` \| `Sold` |
| `transformations` | Object | No | (see below) | Seller-chosen Cloudinary AI transform prefs |
| `createdAt` | Date | Auto | — | Mongoose timestamp |
| `updatedAt` | Date | Auto | — | Mongoose timestamp |

**`transformations` subdocument:**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `removeBg` | Boolean | `false` | AI background removal enabled |
| `replaceBg` | String \| null | `null` | AI background replacement prompt |
| `smartCrop` | Boolean | `true` | AI-aware smart crop |
| `badge` | String \| null | `null` | Text badge overlay (e.g. "NEW") |
| `badgeColor` | String | `"e74c3c"` | Badge background hex color |

### `useritembys` (UserItemBuy)

| Field           | Type     | Required | Description                     |
| --------------- | -------- | -------- | ------------------------------- |
| `itemId`        | String   | ✅       | Reference to UserItemSell `_id` |
| `buyerId`       | String   | ✅       | Auth0 ID or user identifier     |
| `sellerId`      | String   | No       | Copied from the listing         |
| `purchaseDate`  | Date     | Auto     | Date of purchase                |
| `cloudinaryUrl` | String   | ✅       | Item image URL                  |
| `title`         | String   | ✅       | Item title                      |
| `price`         | Number   | ✅       | Purchase price                  |
| `tags`          | String[] | No       | Copied from listing             |

### `users` (User)

| Field                 | Type   | Required | Description              |
| --------------------- | ------ | -------- | ------------------------ |
| `auth0Id`             | String | ✅       | Unique Auth0 identifier  |
| `email`               | String | No       | User email               |
| `username`            | String | No       | Display name             |
| `backboardProfileRef` | String | No       | Backboard profile ID     |
| `styleProfileJSON`    | Object | No       | Stored style preferences |

---

## Services & Integrations

### Cloudinary — ✅ Implemented

- Server-side upload via `cloudinaryService.ts`
- Uses `multer` memory storage to receive file from frontend
- Uploads to `clothesrent/` folder in Cloudinary
- Returns `{ url, publicId, tags }` — auto-tagging enabled (`auto_tagging: 0.6`)
- Validates image format (jpg, jpeg, png, webp)

#### Cloudinary AI Features (Interactive Two-Phase)

The seller upload flow uses a **two-phase architecture** where the image is uploaded first, then the seller previews and selects AI transformations before publishing:

| Phase | Feature | Implementation | Notes |
| --- | --- | --- | --- |
| Upload | **Auto-Tagging** | `categorization: "imagga_tagging"`, `auto_tagging: 0.6` | Tags with ≥60% confidence are auto-applied |
| Preview | **AI Background Removal** | Live URL preview: `e_background_removal` | Requires Cloudinary AI Background Removal add-on |
| Preview | **AI Background Replace** | Live URL preview: `e_gen_background_replace:prompt_{text}` | Requires AI Generative add-on |
| Preview | **Smart Crop** | Live URL preview: `c_fill,g_auto,w_400,h_533` | Free — AI gravity detection |
| Preview | **Conditional Badge** | Live URL preview: `l_text:Arial_16_bold:{text},...` | Free — text overlay |
| Always | **Optimize** | `q_auto,f_auto` appended to all URLs | Free — auto quality + format |

Transformation preferences are stored in the `transformations` subdocument and applied at display time via URL manipulation.

#### Cloudinary URL Transformations (Display-Time)

The frontend applies additional transformations via URL manipulation at display time (see `clothesrent/src/utils/cloudinaryUrl.ts`):

| Feature | URL Transformation | Description |
| --- | --- | --- |
| **Optimize** | `q_auto,f_auto` | Auto quality compression + format (WebP/AVIF) based on browser support |
| **Smart Crop** | `c_fill,g_auto,w_400,h_533` | AI gravity detection — keeps subject in frame |
| **AI Background Removal** | `e_background_removal` | Removes background via URL (requires add-on) |
| **Generative Background Replace** | `e_gen_background_replace:prompt_{text}` | AI-generates a new background from a text prompt |
| **Conditional Badging** | `l_text:Arial_16_bold:{text},co_white,b_rgb:{color},g_north_east` | Overlays text badge (e.g. "NEW") in top-right corner |

Example transformed URL:

```
Original:  https://res.cloudinary.com/dj3drywnu/image/upload/v123/clothesrent/abc.jpg
Optimized: https://res.cloudinary.com/dj3drywnu/image/upload/c_fill,g_auto,w_400,h_533,q_auto,f_auto/v123/clothesrent/abc.jpg
With badge: https://res.cloudinary.com/dj3drywnu/image/upload/c_fill,g_auto,w_400,h_533,q_auto,f_auto/l_text:Arial_16_bold:NEW,co_white,b_rgb:e74c3c,bo_4px_solid_rgb:e74c3c,g_north_east,x_8,y_8/v123/clothesrent/abc.jpg
```

### Backboard.io — 🔧 Stub

- `searchByStyle(query)` — returns matching listing IDs (vector similarity)
- `generateBBLink(imageUrl, title, description)` — generates vector link for new listing
- Currently returns empty/null; implement when Backboard API is ready

### Google Gemini — 🔧 Stub

- `analyzeStyle(images)` — extracts style keywords from images
- Currently returns `{ keywords: [], style: "unknown" }`
- Add `GEMINI_API_URL` + `GEMINI_API_KEY` to `.env` to activate

### Auth0 — ✅ Integrated via Frontend

- Backend receives Auth0 `user.sub` as `sellerId` (on listing creation) and `buyerId` (on purchase)
- The frontend extracts the Auth0 user ID from the `useAuth0()` hook and sends it in API requests
- Self-purchase prevention: backend compares `sellerId === buyerId` and rejects with 400 error
- JWT middleware scaffolded in `middleware/authMiddleware.ts` — not active, enable for production
- Auth0 user IDs follow the format `auth0|abc123` or `google-oauth2|123456`

---

## Validation & Edge Cases

| Validation | Endpoint | Behavior |
|------------|----------|----------|
| Missing title/description/price/location | `POST /api/listings` | 400 error |
| Missing image file | `POST /api/listings` | 400 error |
| Invalid image format | `POST /api/listings` | 500 with descriptive message |
| Duplicate `publicId` | `POST /api/listings` | 409 Conflict |
| Missing `buyerId` | `POST /:id/purchase` | 400 error |
| Item already sold | `POST /:id/purchase` | 410 Gone |
| Buyer = Seller | `POST /:id/purchase` | 400 error |
| Listing not found | `GET/PUT/DELETE /:id` | 404 error |
| Cloudinary failure | `POST /api/listings` | 500 with error message |

---

## Error Response Format

All errors return:

```json
{
  "error": "Human-readable error message"
}
```

---

## Testing with cURL

### Create a listing

```bash
curl -X POST http://localhost:5000/api/listings \
  -F "image=@./trench-coat.jpg" \
  -F "title=Obsidian Trench" \
  -F "description=Minimalist oversized trench coat in black wool blend" \
  -F "price=485" \
  -F "dailyRate=28" \
  -F "tags[]=trench" \
  -F "tags[]=outerwear" \
  -F "sellerId=auth0|abc123"
```

### Get all live listings

```bash
curl http://localhost:5000/api/listings?status=Live
```

### Purchase an item

```bash
curl -X POST http://localhost:5000/api/listings/ITEM_ID/purchase \
  -H "Content-Type: application/json" \
  -d '{"buyerId": "auth0|buyer456"}'
```

### Search by style

```bash
curl -X POST http://localhost:5000/api/style/search \
  -H "Content-Type: application/json" \
  -d '{"query": "minimalist oversized hoodie"}'
```

### Health check

```bash
curl http://localhost:5000/api/health
```

---

## Frontend Integration Notes

The frontend (`clothesrent/`) at `http://localhost:5173` connects to this backend at `http://localhost:5000`. CORS is enabled.

**Seller upload page** (`/shop/new-listing`):

- Currently uploads directly to Cloudinary from the browser
- To use the backend flow instead: submit the form as `multipart/form-data` to `POST /api/listings` with the image file

**Shop page** (`/shop`):

- Fetch listings via `GET /api/listings?status=Live`
- Purchase via `POST /api/listings/:id/purchase`

**Style search**:

- `POST /api/style/search` with `{ query: "..." }`



