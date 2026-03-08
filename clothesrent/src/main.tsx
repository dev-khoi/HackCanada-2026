import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.tsx";
import Navbar from "./components/navBar.tsx";
import type { Listing } from "./types/listing.ts";
import { CartProvider } from "./context/CartContext.tsx";
import { SavesProvider } from "./context/SavesContext.tsx";
import { onNavigate } from "./utils/navigate.ts";

function Root() {
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const { isAuthenticated, isLoading, user } = useAuth0();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    return onNavigate(() => setPath(window.location.pathname));
  }, []);

  // Hide the app navbar on the gate landing page (unauthenticated root) or onboarding
  const hideNavbar = !isLoading && !isAuthenticated && path === "/";

  return (
    <CartProvider userId={user?.sub ?? ""}>
      <SavesProvider userId={user?.sub ?? ""}>
        {!hideNavbar && <Navbar />}
        <App recommendations={recommendations} onClearRecommendations={() => setRecommendations([])} onRecommendations={setRecommendations} />
      </SavesProvider>
    </CartProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-b65r14eontgkyt0y.us.auth0.com"
      clientId="0RjoItM0to13cLRHdYLdBCd61OyiavWk"
      authorizationParams={{
        redirect_uri: `${window.location.origin}/profile`,
      }}>
      <Root />
    </Auth0Provider>
  </StrictMode>,
);
