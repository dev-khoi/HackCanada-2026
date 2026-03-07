import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./profilePage.css";

type StoredProfile = {
  name: string;
  style: string;
  picture: string;
};

export default function ProfilePage() {
  const { user } = useAuth0();
  const storageKey = useMemo(
    () => `clothesrent-profile-${user?.sub ?? "anonymous"}`,
    [user?.sub],
  );

  const [name, setName] = useState("");
  const [style, setStyle] = useState("");
  const [picture, setPicture] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fallbackName = user?.name ?? user?.nickname ?? "";
    const fallbackStyle = "";
    const fallbackPicture = user?.picture ?? "";

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredProfile;
        setName(parsed.name || fallbackName);
        setStyle(parsed.style || fallbackStyle);
        setPicture(parsed.picture || fallbackPicture);
        return;
      }
    } catch {
      // Ignore invalid local storage and fallback to Auth0 data.
    }

    setName(fallbackName);
    setStyle(fallbackStyle);
    setPicture(fallbackPicture);
  }, [storageKey, user?.name, user?.nickname, user?.picture]);

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
    const payload: StoredProfile = { name, style, picture };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSaved(true);
  };

  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1 className="font-display profile-title">Profile</h1>
        <p className="profile-subtitle">Manage your look and style identity.</p>

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
          }}
          placeholder="Your name"
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
