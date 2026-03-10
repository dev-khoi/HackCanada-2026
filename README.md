# wear_abouts

A peer-to-peer clothing rental and resale platform. Users can list items from their wardrobe, browse nearby listings on an interactive map, and use AI-powered style search to discover pieces that match their aesthetic.

---

## Architecture

The project is split into two independently deployable services.

```
/
├── clothesrent/     React + Vite frontend (TypeScript)
└── backend/         Express + Node.js API (TypeScript, MongoDB)
```

**Frontend** — React SPA with client-side routing. Auth via Auth0. Map powered by React Leaflet with a server-side geocoding proxy (Photon). Style search uses Gemini AI image analysis combined with Backboard vector matching.

**Backend** — REST API over Express. MongoDB via Mongoose for listings, users, carts, and saves. Cloudinary handles image upload and storage. Gemini handles AI tagging and listing content generation. Geocoding is proxied server-side to avoid third-party rate limits.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18, Vite, TypeScript |
| Authentication | Auth0 |
| Database | MongoDB Atlas |
| ORM/ODM | Mongoose |
| Image hosting | Cloudinary |
| AI | Google Gemini API |
| Vector / style search | Backboard.io |
| Geocoding | Photon (komoot) via server proxy |
| Map | React Leaflet |
| Frontend hosting | Cloudflare Pages |
| Backend hosting | Render |

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB connection URI
- Auth0 application credentials
- Cloudinary account
- Google Gemini API key

### Backend

```bash
cd backend
cp .env.example .env   # fill in required values
npm install
npm run dev            # starts on port 8000
```

### Frontend

```bash
cd clothesrent
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm install
npm run dev            # starts on port 5173
```

For service-specific environment variables and API documentation, see the READMEs within each subdirectory.

---

## Key Features

- Listing creation with AI-generated titles, descriptions, and tags from uploaded photos
- Interactive map centered on the user's GPS location with distance calculation to each listing
- Style search — describe a look in text or upload reference photos; Gemini + Backboard surface matching listings
- Cart, saves/boards, and per-user public profiles
- Owner controls on listing detail pages (edit, delete, sold status)
- Onboarding flow for new users

---

## Repository Structure

```
clothesrent/          Frontend source
  src/
    api/              API client and typed fetch helpers
    components/       Shared UI components (Navbar, StyleSearchModal, etc.)
    context/          React context providers (Cart, Saves)
    pages/            Page-level components
    types/            Shared TypeScript types
    utils/            Geocoding, distance hooks, navigation, profile storage

backend/              Backend source
  src/
    controllers/      Route handler logic
    models/           Mongoose schemas (Listing, User, Cart, Save)
    routes/           Express routers
    services/         Third-party integrations (Gemini, Backboard, Cloudinary)
```
