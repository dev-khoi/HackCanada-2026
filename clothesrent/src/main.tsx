import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.tsx";
import Navbar from "./components/navBar.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-b65r14eontgkyt0y.us.auth0.com"
      clientId="0RjoItM0to13cLRHdYLdBCd61OyiavWk"
      authorizationParams={{
        redirect_uri: `${window.location.origin}/profile`,
      }}>
      <Navbar />
      <App />
    </Auth0Provider>
  </StrictMode>,
);
