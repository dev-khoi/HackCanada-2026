# ClothesRent - Frontend

## Recent Updates (March 7, 2026)

- Frontend API base URL now reads directly from `VITE_API_URL` (removed hardcoded localhost fallback).
- Added `public/_redirects` with SPA fallback rule for static hosting (`/* /index.html 200`).
- Vite build output is now explicitly configured to `dist` in `vite.config.ts`.
- Thrift Out cards now show `Listed by` under location with a clickable seller profile link.
- Added profile route support for `/profile/:auth0Id` to view public seller profiles.
- Profile saves now sync public fields (name, picture, location) to backend via `/api/users/:auth0Id/public`.
- Listing publish now sends `sellerName` so new listings display creator names immediately.
- Profile page now separates `Name` and `Email` fields, with email shown read-only.
- App flow now requires users to set a profile name before using non-profile pages after sign-in.
- Thrift Out creator labels now follow profile names (resolved from backend user profile), not fallback auth identity strings.

Peer-to-peer clothing rental & resale marketplace. Built with React + TypeScript + Vite, powered by Auth0, Cloudinary, Leaflet maps, and a custom Express backend.

---

## Architecture

```
clothesrent/ (Vite + React + TypeScript)
        │
        ├── Auth0          → Sign in / Sign up / User profile
        ├── Cloudinary     → Image hosting via backend upload
        ├── Leaflet        → Nearby rental map
        │
        └── Express Backend (localhost:5000)
              ├── MongoDB       → Listings, purchases, users
              ├── Cloudinary    → Server-side image upload
              ├── Backboard.io  → Vector style search (stub)
              └── Gemini AI     → Style keyword extraction (stub)
```

---

## Tech Stack

| Layer       | Technology                                              |
| ----------- | ------------------------------------------------------- |
| Framework   | React 19                                                |
| Build Tool  | Vite 7                                                  |
| Language    | TypeScript 5.9                                          |
| Auth        | Auth0 (`@auth0/auth0-react`)                            |
| Images      | Cloudinary (`@cloudinary/react`, `@cloudinary/url-gen`) |
| Maps        | Leaflet + react-leaflet                                 |
| Backend API | Custom Express server (see `../backend/`)               |

---

## Folder Structure

```
clothesrent/
├── public/                        # Static assets
├── src/
│   ├── api/
│   │   ├── client.ts              # API base URL + fetch helpers
│   │   └── listings.ts            # All backend API calls
│   │
│   ├── components/
│   │   ├── CloudinaryImage.tsx    # Cloudinary optimized image component
│   │   ├── ImageTransformPanel.tsx # Interactive AI transformation controls (preview + toggles)
│   │   ├── ListingsPanel.tsx      # Seller's listings (CRUD, status toggle, stored transforms)
│   │   ├── TransactionsPanel.tsx  # Purchase history table
│   │   ├── ThriftOutPanel.tsx     # Browse & purchase live listings + stored transforms
|   |   |- PersonalizePanel.tsx    # Upload up to 10 looks + AI style suggestion (stub)
│   │   ├── navBar.tsx             # Top navigation (Home, Shop, placeholder search, auth actions)
│   │   └── uploadPhotoButton.tsx  # Direct-to-Cloudinary upload button
│   │
│   ├── pages/
│   │   ├── shopPage.tsx           # Seller dashboard (3-tab layout)
│   │   ├── shopPage.css           # Shop page styles
|   |   |- profilePage.tsx         # User profile page (picture, name, style)
|   |   |- profilePage.css         # Profile page styles
│   │   ├── sellerUploadPosting.tsx # Multi-step listing creator (Upload → Enhance → Details)
│   │   └── sellerUploadPosting.css
│   │
│   ├── types/
│   │   └── listing.ts             # Shared TypeScript types (Listing, Purchase)
│   │
│   ├── utils/
│   │   ├── cloudinary.ts          # Cloudinary SDK init helper
│   │   └── cloudinaryUrl.ts       # URL transformation utility (AI features)
│   │
│   ├── App.tsx                    # Router + all page components
│   ├── App.css                    # Global app styles
│   ├── main.tsx                   # Entry point (Auth0Provider + Navbar)
│   └── index.css                  # Base CSS variables & reset
│
├── .env.local                     # Environment variables (not committed)
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## Pages & Routes

| Path | Component | Description |
| --- | --- | --- |
| `/` | `LandingPage` | Hero product carousel + nearby rental map |
| `/shop` | `ShopPage` | Seller dashboard with 4 tabs |
| `/shop/new-listing` | `SellerUploadPosting` | Create a new listing form |
| `/profile` | `ProfilePage` | User profile (picture, name, style, location) |
| `/signin` | `SignInPage` | Auth0 login / signup entry page |

---

## Features

### 1. Landing Page (`/`)

- **Product Carousel** — auto-scrolling marquee of featured rental items with hover-pause, manual arrow navigation, and "Reserve" overlay buttons
- **Nearby Rental Map** — Leaflet map centered on Toronto showing rental pickup points with circle markers and popup ETAs
- **Footer** — brand info, shop/help/brand link columns, social links
- **Navbar** - fixed top nav with brand + Home + Shop, a placeholder search bar that writes ?q= in URL for future search integration, and auth-aware actions (Sign In becomes Profile + Sign Out when authenticated). Navbar z-index stays above map layers while scrolling

### 2. Seller Dashboard (`/shop`)

Four-tab sidebar layout. Displays the signed-in user's nickname/email. All tabs receive the Auth0 `user.sub` as `userId` and scope data to the current user.

#### Tab: My Listings (`ListingsPanel`)

- Fetches all seller listings from `GET /api/listings` and **filters by current user's Auth0 ID**
- Displays **Cloudinary-optimized** images (smart crop 400×533, auto quality/format)
- Title, description, price, daily rate, tags
- Status badges: **Live** (green), **Draft** / **Paused** (grey), **Sold** (red)
- **Pause / Go Live** toggle button per listing
- **Delete** button with confirmation
- **Create Listing** link → `/shop/new-listing`
- Loading state, error state with retry, empty state

#### Tab: Transaction Log (`TransactionsPanel`)

- Fetches purchase records from `GET /api/purchases` and **filters by current user** (as buyer or seller)
- Table view with **Cloudinary thumbnail** images (64×64 smart crop)
- Shows **Buyer / Seller role pill** instead of raw IDs
- Item title, price, date, tags
- Loading / error / empty states

#### Tab: Thrift Out (`ThriftOutPanel`)

- Fetches live listings from `GET /api/listings?status=Live`
- **Style search bar** — searches via `POST /api/style/search` (Backboard vector → MongoDB fallback)
- Clear button to reset to all live listings
- **Price filters** — min/max price filter inputs
- **Proximity filter** — "Near Me" toggle using saved profile location + selectable radius
- **Auth0-powered purchases** — uses signed-in user's Auth0 ID as `buyerId` (no manual prompt)
- **"Your listing" pill** shown on items where `sellerId === userId` — purchase button hidden
- **Conditional "NEW" badge** — items created within the last 24 hours display a red "NEW" overlay via Cloudinary URL transformation
- **Cloudinary-optimized images** — smart crop (400×533) + auto quality/format
- Prevents self-purchase and double-purchase (backend validated)

### 3. Create Listing — Multi-Step Flow (`/shop/new-listing`)
#### Tab: Personalize (`PersonalizePanel`)
- Search by saved style prompt or upload up to 10 inspiration images
- Styled "Browse Photos" action aligned with site button styling
- Thumbnail grid preview of selected uploads before analysis
- Uses Gemini image analysis + Backboard recommendations for personalized matches
- Shows returned style and allows manual edits
- Saves the chosen style to profile storage so `/profile` shows the updated style


Three-step interactive listing creator with live AI transformation preview:

#### Step 1: Upload

- **Image upload** — selects a local file (jpg/png/webp), shows local preview
- Click "Upload to Cloudinary" → `POST /api/upload`
- Returns Cloudinary URL + publicId + auto-generated AI tags
- Progress indicator during upload

#### Step 2: Enhance (ImageTransformPanel)

- **Before / After** side-by-side preview using live Cloudinary URL transformations
- **Loading overlay on previews** - while transformed images are reloading, a spinner overlay appears so users always know changes are still processing
- **AI Background Removal** toggle — removes the background, keeps the garment
- **AI Background Replace** toggle + prompt input — generates a new background from a text prompt (e.g. "clean white studio", "urban street scene")
- **Smart Crop** toggle — AI-aware crop that keeps the garment centered (on by default)
- **Badge Overlay** toggle + text input + color picker — adds a text badge (e.g. "NEW", "SALE") in the top-right corner
- Auto optimization note (q_auto, f_auto always applied)

#### Step 3: Details & Publish

- Title, description, price (required)
- Daily rate, comma-separated tags (optional)
- Location address (required) with type-ahead address suggestions (address, postal code, city, country)
- "Use Profile Location" button to prefill listing location from saved profile
- **Auth0 `user.sub`** automatically sent as `sellerId`
- Preview image shows the **transformed version** (Cloudinary URL with all step-2 transformations applied)
- **Details preview loading overlay** appears while the final transformed image is still loading
- Tag pills show a **live merged preview** of both Cloudinary auto-tags and any user-typed tags, updating as you type
- Submits JSON body to `POST /api/listings` (includes pre-uploaded URL + publicId + transformation preferences)
- Transformation preferences stored in database for consistent display
- Success message shown, all state resets to Step 1

### 4. Sign In (`/signin`)

- Auth0-powered login and signup
- Successful auth redirects to `/profile`
- Logout button with redirect back to `/signin`

### 5. Profile (`/profile`)

- Protected page for authenticated users
- Displays profile picture, name, style, and location (with type-ahead suggestions (address, postal code, city, country), backed by `/api/location/suggest` for better reliability)
- "Use Current Location" button asks browser permission and reverse-fills the address
- Profile picture can be changed via local image upload
- Name/style and custom picture are saved in local storage per Auth0 user
- Style can also be updated from Shop -> Personalize and appears here automatically
- Saved profile location is geocoded and shown on the landing page map

---

## API Layer (`src/api/`)

All backend communication is centralized in two files:

### `client.ts`

| Export | Description |
| --- | --- |
| `API_BASE_URL` | Reads from `VITE_API_URL` env var |
| `apiFetch<T>(path, options)` | JSON fetch with error extraction |
| `apiFormFetch<T>(path, formData)` | FormData POST (no Content-Type header — browser sets boundary) |

### `listings.ts`

| Function | Method | Endpoint | Description |
| --- | --- | --- | --- |
| `fetchListings(status?)` | GET | `/api/listings` | Get all or filtered listings |
| `fetchListingById(id)` | GET | `/api/listings/:id` | Single listing |
| `uploadImage(formData)` | POST | `/api/upload` | Upload image only (returns URL + publicId + tags) |
| `createListing(body)` | POST | `/api/listings` | Create listing with JSON body (pre-uploaded image + transforms) |
| `updateListing(id, data)` | PUT | `/api/listings/:id` | Update fields |
| `deleteListing(id)` | DELETE | `/api/listings/:id` | Remove listing |
| `purchaseListing(id, buyerId)` | POST | `/api/listings/:id/purchase` | Purchase item |
| `searchListings(query)` | POST | `/api/style/search` | Style-based search |
| `fetchPurchases()` | GET | `/api/purchases` | All purchase records |

---

## Components

| Component | File | Props | Description |
| --- | --- | --- | --- |
| `Navbar` | `navBar.tsx` | — | Top nav with brand, Home/Shop links, a placeholder search form, and auth-aware actions (Sign In or Profile + Sign Out). Adds `scrolled` class on scroll |
| `CloudinaryImage` | `CloudinaryImage.tsx` | `publicId, alt, width, height, className` | Renders optimized Cloudinary image via `@cloudinary/react` |
| `ImageTransformPanel` | `ImageTransformPanel.tsx` | `cloudinaryUrl, onChange` | Interactive AI transformation controls with live before/after preview |
| `UploadPhotoButton` | `uploadPhotoButton.tsx` | `onUploadSuccess, onUploadError, buttonLabel, uploadPreset` | Direct-to-Cloudinary browser upload utility (not mounted on homepage) |
| `ListingsPanel` | `ListingsPanel.tsx` | `userId: string` | Seller's listing management — applies stored transformations to display images |
| `TransactionsPanel` | `TransactionsPanel.tsx` | `userId: string` | Purchase history — shows buyer/seller role pill, Cloudinary thumbnails |
| `ThriftOutPanel` | `ThriftOutPanel.tsx` | `userId: string` | Browse live listings — applies stored transformations + conditional badges, Auth0-powered purchase |
| `PersonalizePanel` | `PersonalizePanel.tsx` | `userId, fallbackName, fallbackPicture` | Save a style prompt or analyze up to 10 photos, then show personalized recommendations from Backboard |

---

## Utilities

### `utils/cloudinaryUrl.ts` — Cloudinary URL Transformation

Inserts transformation parameters into existing Cloudinary `secure_url` strings. All functions return a new URL string; the original is unchanged.

| Function | Purpose | Cloudinary Params |
| --- | --- | --- |
| `optimizeUrl(url)` | Auto quality + auto format | `q_auto,f_auto` |
| `smartCropUrl(url, w, h)` | AI-aware crop to exact dimensions | `c_fill,g_auto,w_{w},h_{h},q_auto,f_auto` |
| `removeBgUrl(url)` | AI background removal | `e_background_removal` |
| `replaceBgUrl(url, prompt)` | Generative AI background replacement | `e_gen_background_replace:prompt_{text}` |
| `addBadge(url, text, bgColor?, textColor?)` | Text overlay badge (top-right) | `l_text:Arial_16_bold:{text},co_{color},b_rgb:{bg},...` |
| `buildDisplayUrl(url, options)` | Combines all transformations | Chains bg → crop → badge |
| `thumbnailUrl(url, size)` | Square thumbnail for tables | `c_fill,g_auto,w_{size},h_{size},q_auto,f_auto` |

**Usage in components:**

```typescript
import { buildDisplayUrl, thumbnailUrl } from "../utils/cloudinaryUrl";

// Card image — smart crop + optimize + optional "NEW" badge
const cardUrl = buildDisplayUrl(item.cloudinaryUrl, {
  width: 400,
  height: 533,
  badge: isNew ? "NEW" : undefined,
});

// Table thumbnail — 64×64 square
const thumbUrl = thumbnailUrl(purchase.cloudinaryUrl, 64);
```

---

## Shared Types (`src/types/listing.ts`)

```typescript
type ListingStatus = "Draft" | "Live" | "Paused" | "Sold";

interface ImageTransformations {
  removeBg: boolean; // AI background removal
  replaceBg: string | null; // AI background replacement prompt
  smartCrop: boolean; // AI-aware smart crop
  badge: string | null; // Text badge overlay
  badgeColor: string; // Badge hex color (default "e74c3c")
}

interface Listing {
  _id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  dailyRate: number;
  cloudinaryUrl: string;
  publicId: string;
  tags: string[];
  bbLink?: string;
  status: ListingStatus;
  transformations?: ImageTransformations;
  createdAt: string;
  updatedAt: string;
}

interface Purchase {
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
```

---

## Prerequisites

- **Node.js** v18+
- **Backend running** at `http://localhost:5000` (see `../backend/README.md`)

---

## Setup

### 1. Install dependencies

```bash
cd clothesrent
npm install
```

### 2. Configure environment variables

Create `.env.local`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Required � backend API base URL
VITE_API_URL=http://localhost:5000
```

### 3. Start the backend

```bash
cd ../backend
npm run dev
```

### 4. Start the frontend

```bash
cd ../clothesrent
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR           |
| `npm run build`   | TypeScript check + production Vite build |
| `npm run lint`    | Run ESLint                               |
| `npm run preview` | Preview production build locally         |

---

## Auth0 Configuration

| Setting      | Value                               |
| ------------ | ----------------------------------- |
| Domain       | `dev-b65r14eontgkyt0y.us.auth0.com` |
| Client ID    | `0RjoItM0to13cLRHdYLdBCd61OyiavWk`  |
| Redirect URI | `{origin}/profile`                  |
| Signup       | Screen hint → `signup`              |
| Logout       | Returns to `/signin`                |

---

## End-to-End Flow

### Seller creates a listing

```
1. Sign in via Auth0 at /signin
2. Navigate to /shop → click "Create Listing"
3. Step 1 — Upload:
   a. Select image file (jpg/png/webp) → local preview shown
   b. Click "Upload to Cloudinary" → POST /api/upload
   c. Image uploaded with AI auto-tagging → returns URL + publicId + tags
4. Step 2 — Enhance:
   a. Before/After preview panel shows original vs. enhanced
   b. Toggle AI Background Removal (removes bg, keeps garment)
   c. Toggle AI Background Replace + enter prompt (e.g. "white studio")
   d. Toggle Smart Crop (AI-aware — on by default)
   e. Toggle Badge Overlay + set text + pick color
   f. All changes preview live via Cloudinary URL transformations
   g. Click "Continue to Details"
5. Step 3 — Details & Publish:
   a. Fill in title, description, price (required)
   b. Optional: daily rate, comma-separated tags
   c. Preview image shows the **transformed version** (with all step-2 AI effects applied)
   d. Tag pills show a **live merged preview** of Cloudinary auto-tags + user-typed tags
   e. Auth0 user.sub auto-included as sellerId
   f. Click "Publish Listing"
6. Frontend sends JSON body → POST /api/listings
   (includes cloudinaryUrl, publicId, autoTags, transformations preferences)
7. Backend saves listing to MongoDB with transformation preferences
8. Success message shown, form resets to Step 1
9. Listing appears in "My Listings" tab with stored transformations applied
```

### Buyer purchases an item

```
1. Sign in via Auth0 at /signin
2. Navigate to /shop → click "Thrift Out" tab
3. Browse live listings or search by style
4. Own listings show "Your listing" pill (cannot purchase)
5. Items created within 24hrs display a "NEW" badge overlay
6. Click "Purchase" on desired item → confirm dialog
7. Auth0 user.sub automatically sent as buyerId → POST /api/listings/:id/purchase
8. Backend validates: item exists, not sold, buyer ≠ seller
9. Creates UserItemBuy record, marks item "Sold"
10. Item removed from Thrift Out view
11. Appears in "Transaction Log" with Buyer/Seller role pill
```

### Style search

```
1. In "Thrift Out" tab, type style query (e.g. "minimalist oversized hoodie")
2. Press Enter or click Search
3. POST /api/style/search → Backboard vector search → MongoDB fallback
4. Results displayed as cards with optimized Cloudinary images, prices, tags
5. Click "Clear" to return to all live listings
```

---

## Image Optimization

All images served through Cloudinary's CDN with transformations applied via URL params:

| Context | Dimensions | Transformations |
| --- | --- | --- |
| Card images (Listings, ThriftOut) | 400 × 533 (3:4) | `c_fill,g_auto,q_auto,f_auto` + stored transforms |
| Table thumbnails (Transactions) | 64 × 64 | `c_fill,g_auto,q_auto,f_auto` |
| Conditional badge ("NEW") | Same as card | + `l_text:Arial_16_bold:NEW,...` overlay |
| Transform preview (Seller upload) | 400 × 533 (3:4) | Dynamic — live preview based on toggle state |

Display components (`ListingsPanel`, `ThriftOutPanel`) read the `listing.transformations` field from the database and pass it to `buildDisplayUrl()` so the seller's chosen enhancements are applied consistently everywhere the image is shown.

Grid cards are capped at `max-width: 320px` with `auto-fill` layout (no stretching on wide screens). All images use `loading="lazy"` for deferred loading below the fold.
















