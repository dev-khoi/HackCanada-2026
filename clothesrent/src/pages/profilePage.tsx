import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./profilePage.css";
import {
  loadUserProfile,
  PROFILE_UPDATED_EVENT,
  saveUserProfile,
  type UserProfileData,
} from "../utils/profileStorage";
import LocationAutocompleteInput from "../components/LocationAutocompleteInput";
import { reverseGeocodeToSimpleAddress } from "../utils/location";
import {
  fetchPublicUserProfile,
  savePublicUserProfile,
} from "../api/listings";

interface ProfilePageProps {
  profileUserId?: string;
  requireName?: boolean;
}

export default function ProfilePage({ profileUserId, requireName = false }: ProfilePageProps) {
  const { user } = useAuth0();
  const authUserId = useMemo(() => user?.sub ?? "anonymous", [user?.sub]);
  const viewedUserId = profileUserId ?? authUserId;
  const isOwnProfile = !profileUserId || profileUserId === authUserId;

  const [name, setName] = useState("");
  const [style, setStyle] = useState("");
  const [picture, setPicture] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    const fallback: UserProfileData = {
      name: user?.name ?? user?.nickname ?? "",
      style: "",
      picture: user?.picture ?? "",
      location: "",
    };

    if (isOwnProfile) {
      const profile = loadUserProfile(authUserId, fallback);
      setName(profile.name);
      setStyle(profile.style);
      setPicture(profile.picture);
      setLocation(profile.location);
      fetchPublicUserProfile(authUserId)
        .then((publicProfile) => {
          if (publicProfile.name) setName(publicProfile.name);
          if (publicProfile.picture) setPicture(publicProfile.picture);
          if (publicProfile.location) setLocation(publicProfile.location);
        })
        .catch(() => {});
      return;
    }

    setLoadingProfile(true);
    fetchPublicUserProfile(viewedUserId)
      .then((publicProfile) => {
        setName(publicProfile.name || viewedUserId);
        setPicture(publicProfile.picture || "");
        setLocation(publicProfile.location || "");
        setStyle("");
      })
      .catch(() => {
        setName(viewedUserId);
        setPicture("");
        setLocation("");
        setStyle("");
      })
      .finally(() => setLoadingProfile(false));
  }, [
    authUserId,
    isOwnProfile,
    user?.name,
    user?.nickname,
    user?.picture,
    viewedUserId,
  ]);

  useEffect(() => {
    if (!isOwnProfile) return;

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<UserProfileData>;
      const updated = customEvent.detail;
      if (!updated) return;
      setName(updated.name);
      setStyle(updated.style);
      setPicture(updated.picture);
      setLocation(updated.location);
      setSaved(true);
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [isOwnProfile]);

  const handlePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPicture(reader.result);
        setSaved(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (isOwnProfile && !name.trim()) {
      setNameError("Name is required.");
      setSaved(false);
      return;
    }

    const payload: UserProfileData = { name, style, picture, location };
    saveUserProfile(authUserId, payload);
    savePublicUserProfile(authUserId, {
      name,
      picture,
      location,
      email: user?.email,
    }).catch(() => {});
    setNameError(null);
    setSaved(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported in this browser.");
      return;
    }

    setLocationBusy(true);
    setLocationMessage("Requesting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const address = await reverseGeocodeToSimpleAddress(
          position.coords.latitude,
          position.coords.longitude,
        );

        if (!address) {
          setLocationMessage("Could not resolve your location to an address.");
          setLocationBusy(false);
          return;
        }

        setLocation(address);
        setSaved(false);
        setLocationBusy(false);
        setLocationMessage("Current location filled. Review and save profile.");
      },
      (error) => {
        setLocationBusy(false);
        if (error.code === 1) {
          setLocationMessage("Location permission denied.");
          return;
        }
        setLocationMessage("Could not get current location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  if (loadingProfile) {
    return (
      <main className="profile-page">
        <section className="profile-card">
          <h1 className="font-display profile-title">Profile</h1>
          <p className="profile-subtitle">Loading profile...</p>
        </section>
      </main>
    );
  }

  if (!isOwnProfile) {
    return (
      <main className="profile-page">
        <section className="profile-card">
          <a href="/shop" className="profile-back-link">
            Back to Shop
          </a>
          <h1 className="font-display profile-title">{name || "User Profile"}</h1>
          <p className="profile-subtitle">Public seller profile.</p>

          <div className="profile-picture-wrap">
            {picture ? (
              <img src={picture} alt="User profile" className="profile-picture" />
            ) : (
              <div className="profile-picture profile-picture-fallback">No Image</div>
            )}
          </div>

          <label className="profile-label">Name</label>
          <p className="profile-readonly-field">{name || viewedUserId}</p>

          <label className="profile-label">Location</label>
          <p className="profile-readonly-field">{location || "Not provided"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1 className="font-display profile-title">Profile</h1>
        <p className="profile-subtitle">
          {requireName
            ? "Set your profile name to continue. Name is required."
            : "Manage your look and style identity."}
        </p>

        <div className="profile-picture-wrap">
          {picture ? (
            <img src={picture} alt="User profile" className="profile-picture" />
          ) : (
            <div className="profile-picture profile-picture-fallback">No Image</div>
          )}
        </div>

        <label className="profile-label" htmlFor="profile-picture-upload">
          Profile Picture
        </label>
        <input
          id="profile-picture-upload"
          type="file"
          accept="image/*"
          className="profile-input-file"
          onChange={handlePictureChange}
        />

        <label className="profile-label" htmlFor="profile-name">
          Name
        </label>
        <input
          id="profile-name"
          className="profile-input"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
            setNameError(null);
          }}
          placeholder="Your name"
          required
        />
        {nameError && <p className="profile-error-message">{nameError}</p>}

        <label className="profile-label" htmlFor="profile-email">
          Email
        </label>
        <input
          id="profile-email"
          className="profile-input"
          value={user?.email ?? ""}
          readOnly
        />

        <label className="profile-label" htmlFor="profile-style">
          Style
        </label>
        <input
          id="profile-style"
          className="profile-input"
          value={style}
          onChange={(event) => {
            setStyle(event.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Goth"
        />

        <label className="profile-label" htmlFor="profile-location">
          Location
        </label>
        <LocationAutocompleteInput
          id="profile-location"
          inputClassName="profile-input"
          value={location}
          onChange={(next) => {
            setLocation(next);
            setSaved(false);
            setLocationMessage(null);
          }}
          placeholder="e.g. 100 Queen St W, Toronto"
        />
        <div className="profile-location-row">
          <button
            type="button"
            className="btn-outline profile-location-btn"
            onClick={handleUseCurrentLocation}
            disabled={locationBusy}>
            {locationBusy ? "Locating..." : "Use Current Location"}
          </button>
          {locationMessage && (
            <p className="profile-location-message">{locationMessage}</p>
          )}
        </div>

        <div className="profile-actions">
          <button type="button" className="btn-primary profile-save-btn" onClick={handleSave}>
            Save Profile
          </button>
          {saved && <span className="profile-saved">Saved</span>}
        </div>
      </section>
    </main>
  );
}
