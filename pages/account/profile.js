import Head from "next/head";
import { useEffect, useState } from "react";

const BRAND_YELLOW = "#FFC400";

function getImageUrlFromIncluded(user) {
  const imageId = user?.relationships?.profileImage?.data?.id?.uuid;
  const image = user?.included?.find(
    item => item?.type === "image" && item?.id?.uuid === imageId
  );

  const variants = image?.attributes?.variants || {};

  const nonSquareVariant = Object.entries(variants).find(([key, value]) => {
    return value?.url && !key.toLowerCase().includes("square");
  });

  return (
    variants.default?.url ||
    variants["landscape-crop"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    nonSquareVariant?.[1]?.url ||
    Object.values(variants).find(v => v?.url)?.url ||
    null
  );
}

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sdk, setSdk] = useState(null);
  const [user, setUser] = useState(null);

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

 const [form, setForm] = useState({
  companyName: "",
  sellerName: "",
  sellerLocation: "",
  phoneNumber: "",
  website: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  bio: ""
});

  useEffect(() => {
    async function loadProfile() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdkInstance = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        setSdk(sdkInstance);

        const response = await sdkInstance.currentUser.show({
          include: ["profileImage"]
        });

        const currentUser = {
          ...response.data.data,
          included: response.data.included || []
        };

        const profile = currentUser.attributes?.profile || {};
        const publicData = profile.publicData || {};
        const protectedData = profile.protectedData || {};

        setUser(currentUser);

        setForm({
  companyName: publicData.companyName || profile.abbreviatedName || "",
  sellerName: publicData.sellerName || profile.displayName || "",
  sellerLocation:
    publicData.sellerLocation ||
    publicData.location ||
    publicData.cityState ||
    "",
  phoneNumber: protectedData.phoneNumber || publicData.phoneNumber || "",
  website: publicData.website || "",
  facebookUrl: publicData.facebookUrl || "",
  instagramUrl: publicData.instagramUrl || "",
  linkedinUrl: publicData.linkedinUrl || "",
  youtubeUrl: publicData.youtubeUrl || "",
  tiktokUrl: publicData.tiktokUrl || "",
  bio: publicData.bio || publicData.companyBio || ""
});
        
        setLogoPreview(getImageUrlFromIncluded(currentUser));
      } catch (err) {
        window.location.href = `/login?next=${encodeURIComponent(
          "/account/profile"
        )}`;
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateField(key, value) {
  setForm(prev => ({
    ...prev,
    [key]: value
  }));
}

function SocialInput({ icon, label, value, onChange, placeholder }) {
  return (
    <label className="social-field">
      <span>{label}</span>

      <div className="social-input">
        <i className={icon}></i>

        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!sdk) return;

    setSaving(true);

    try {
      let profileImageId =
        user?.relationships?.profileImage?.data?.id?.uuid || null;

      if (logoFile) {
        const uploadResponse = await sdk.images.upload({
          image: logoFile
        });

        profileImageId =
          uploadResponse?.data?.data?.id?.uuid ||
          uploadResponse?.data?.data?.id ||
          profileImageId;
      }

      const currentProfile = user?.attributes?.profile || {};
      const currentPublicData = currentProfile.publicData || {};
      const currentProtectedData = currentProfile.protectedData || {};

      const params = {
        displayName:
          form.sellerName.trim() ||
          form.companyName.trim() ||
          currentProfile.displayName ||
          "IronXchange Seller",

       publicData: {
  ...currentPublicData,
  companyName: form.companyName.trim(),
  sellerName: form.sellerName.trim(),
  sellerLocation: form.sellerLocation.trim(),
  location: form.sellerLocation.trim(),
  cityState: form.sellerLocation.trim(),
  website: form.website.trim(),
  facebookUrl: form.facebookUrl.trim(),
  instagramUrl: form.instagramUrl.trim(),
  linkedinUrl: form.linkedinUrl.trim(),
  youtubeUrl: form.youtubeUrl.trim(),
  tiktokUrl: form.tiktokUrl.trim(),
  bio: form.bio.trim(),
  companyBio: form.bio.trim()
},
        

        protectedData: {
          ...currentProtectedData,
          phoneNumber: form.phoneNumber.trim()
        }
      };

      if (logoFile && profileImageId) {
  params.profileImageId = profileImageId;
}

      const response = await sdk.currentUser.updateProfile(params, {
        expand: true,
        include: ["profileImage"]
      });

      const updatedUser = {
        ...response.data.data,
        included: response.data.included || []
      };

      setUser(updatedUser);
      setLogoPreview(getImageUrlFromIncluded(updatedUser) || logoPreview);

      alert("Profile saved.");
    } catch (err) {
      alert(`Profile save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await sdk?.logout();
    } catch {}

    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="loading">
        Loading...
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img
              src="/images/ironxchange-logo.png"
              className="logo-img"
              alt="IronXchange"
            />
          </a>

          <div className="nav-links">
            <a href="/browse">SEARCH</a>

            <a href="/post-free" className="yellow-link">
              POST FREE
            </a>

            <button type="button" onClick={handleLogout} className="logout-btn">
              LOGOUT
            </button>

            <a href="/account" className="login-icon logged-in" aria-label="Account">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="dashboard">
          <aside className="rail">
            <div className="rail-top">
              <div className="user-dot">
                {logoPreview ? (
                  <img src={logoPreview} alt={form.companyName || "Seller"} />
                ) : (
                  <i className="fa-regular fa-user"></i>
                )}
              </div>

              <strong>{form.sellerName || "IronXchange User"}</strong>
              <span>{form.companyName || "Seller Profile"}</span>
            </div>

            <a href="/account">
              <i className="fa-solid fa-gauge-high"></i>
              Dashboard
            </a>

            <a href="/account/listings">
              <i className="fa-solid fa-list"></i>
              Listings
            </a>

            <a href="/account/messages">
              <i className="fa-regular fa-envelope"></i>
              Inquiries
            </a>

           <a href="/saved">
  <i className="fa-regular fa-star"></i>
  Saved
</a>

<a href="/account/profile">
  <i className="fa-regular fa-id-card"></i>
  Profile
</a>

<a href="/account/settings">
  <i className="fa-solid fa-gear"></i>
  Settings
</a>
          </aside>

          <section className="content">
            <div className="page-head">
              <div>
                <a href="/account" className="back-link">
                  ← Back to Dashboard
                </a>

                <h1>Seller Profile</h1>

                <p>
                  Configure your public seller yard, listing identity, and dealership presence across IronXchange.
                </p>
              </div>

              <button
                type="button"
                className="save-top"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "SAVING..." : "SAVE PROFILE"}
              </button>
            </div>

            <form className="profile-grid" onSubmit={handleSave}>
              <section className="panel logo-panel">
                <h2>Seller Logo</h2>

                <div className="logo-preview-box">
                  {logoPreview ? (
                    <img src={logoPreview} alt={form.companyName || "Seller logo"} />
                  ) : (
                    <div className="empty-logo">
                      <i className="fa-regular fa-image"></i>
                      <span>No logo uploaded</span>
                    </div>
                  )}
                </div>

                <label className="upload-btn">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoChange}
                  />
                </label>

                <p className="help">
                  Best: transparent PNG. Recommended width: 1200px. Your logo will not be cropped, circled, or distorted.
                </p>
              </section>

              <section className="panel form-panel">
                <h2>Seller Information</h2>

                <div className="form-grid">
                  <label>
                    Company Name
                    <input
                      value={form.companyName}
                      onChange={e => updateField("companyName", e.target.value)}
                      placeholder="Concho Inc."
                    />
                  </label>

                  <label>
                    Seller Name
                    <input
                      value={form.sellerName}
                      onChange={e => updateField("sellerName", e.target.value)}
                      placeholder="Barry"
                    />
                  </label>

                  <label>
                    Seller Location
                    <input
                      value={form.sellerLocation}
                      onChange={e => updateField("sellerLocation", e.target.value)}
                      placeholder="Midland, TX"
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      value={form.phoneNumber}
                      onChange={e => updateField("phoneNumber", e.target.value)}
                      placeholder="(432) 555-0000"
                    />
                  </label>

                  <label>
                    Website
                    <input
                      value={form.website}
                      onChange={e => updateField("website", e.target.value)}
                      placeholder="conchoinc.com"
                    />
                  </label>

                        <label>
  Facebook
  <input
    value={form.facebookUrl}
    onChange={e => updateField("facebookUrl", e.target.value)}
    placeholder="https://facebook.com/company"
  />
</label>

<label>
  Instagram
  <input
    value={form.instagramUrl}
    onChange={e => updateField("instagramUrl", e.target.value)}
    placeholder="https://instagram.com/company"
  />
</label>

<label>
  LinkedIn
  <input
    value={form.linkedinUrl}
    onChange={e => updateField("linkedinUrl", e.target.value)}
    placeholder="https://linkedin.com/company/company-name"
  />
</label>

<label>
  YouTube
  <input
    value={form.youtubeUrl}
    onChange={e => updateField("youtubeUrl", e.target.value)}
    placeholder="https://youtube.com/@company"
  />
</label>

<label>
  TikTok
  <input
    value={form.tiktokUrl}
    onChange={e => updateField("tiktokUrl", e.target.value)}
    placeholder="https://tiktok.com/@company"
  />
</label>
                  <label className="full">
                    About Seller
                    <textarea
                      value={form.bio}
                      onChange={e => updateField("bio", e.target.value)}
                      placeholder="Tell buyers who you are, what you sell, and how you operate."
                      rows={7}
                    />
                  </label>
                </div>

                <div className="actions">
                  <a href="/account" className="cancel-btn">
                    CANCEL
                  </a>

                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? "SAVING..." : "SAVE PROFILE"}
                  </button>
                </div>
              </section>
            </form>
          </section>
        </section>
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background: #0b0b0b;
        }

        .nav {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 2%;
          background: #050505;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .logo-img {
          height: 38px;
          display: block;
          width: auto;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .nav-links a,
        .logout-btn {
          color: white;
          text-decoration: none;
          background: transparent;
          border: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: .5px;
          cursor: pointer;
        }

        .yellow-link {
          color: ${BRAND_YELLOW} !important;
        }

        .logout-btn {
          color: #9a9a9a;
        }

        .login-icon {
          border: 2px solid white;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          font-size: 14px !important;
        }

        .login-icon.logged-in {
          border-color: #38A169;
          color: #38A169 !important;
        }

       .dashboard {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 8px;
  padding: 10px 1.25%;
  max-width: 1680px;
  height: calc(100vh - 64px);
  margin: 0 auto;
  overflow: hidden;
}

        .rail {
  background: #111;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 6px;
  min-height: 0;
  overflow: hidden;
}
       .rail-top {
  text-align: center;
  padding: 4px 4px 7px;
  border-bottom: 1px solid #252525;
  margin-bottom: 6px;
}

       .user-dot {
  width: 126px;
  height: 64px;

  border: 1px solid #F2F2F2;
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin: 0 auto 8px;

  background: #050505;
  overflow: hidden;

  padding: 7px;
}

.user-dot img {
  width: 165%;
  height: 165%;
  object-fit: contain;
  object-position: center;
  display: block;
}

        .rail-top strong {
          display: block;
          color: #f2f2f2;
          font-size: 12px;
        }

        .rail-top span {
          display: block;
          margin-top: 3px;
          color: #888;
          font-size: 10px;
        }

      .rail a {
  display: flex;
  align-items: center;
  gap: 8px;

  color: #bdbdbd;
  text-decoration: none;

  font-size: 10px;
  font-weight: 900;
  letter-spacing: .35px;
  text-transform: uppercase;

  padding: 7px 7px;

  border-radius: 8px;
}

        .rail a.active,
        .rail a:hover {
          background: #1b1b1b;
          color: #f2f2f2;
        }

        .rail i {
          width: 16px;
          color: ${BRAND_YELLOW};
        }

        .content {
          min-width: 0;
        }

        .page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;

  background: #151515;
  border: 1px solid #282828;
  border-radius: 10px;

  padding: 14px 16px;
  margin-bottom: 8px;
}

        .back-link {
          display: inline-block;
          color: rgba(255,255,255,.55);
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .55px;
          margin-bottom: 12px;
        }

        .back-link:hover {
          color: rgba(255,255,255,.9);
        }

     h1 {
  margin: 0;
  color: #f2f2f2;
  font-size: 22px;
  letter-spacing: -0.35px;
  text-transform: uppercase;
}

      .page-head p {
  margin: 6px 0 0;
  color: #8a8a8a;
  font-size: 12px;
  line-height: 1.45;
  max-width: 700px;
}

      .save-top,
.save-btn {
  height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: #FFC400;
  color: #050505;

  border: none;
  border-radius: 8px;

  padding: 0 16px;

  font-size: 11px;
  font-weight: 900;
  letter-spacing: .35px;

  cursor: pointer;
  white-space: nowrap;
}

        .save-top:disabled,
        .save-btn:disabled {
          opacity: .6;
          cursor: default;
        }

        .profile-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 8px;
}

      .panel {
  background: #151515;
  border: 1px solid #282828;
  border-radius: 10px;
  padding: 16px;
}

        .panel h2 {
  margin: 0 0 12px;
  color: #f2f2f2;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

        .logo-preview-box {
  width: 100%;
  height: 132px;
  background: #090909;
  border: 1px solid #2a2a2a;
  border-radius: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 18px;
  margin-bottom: 10px;
}

        .logo-preview-box img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .empty-logo {
          color: #777;
          display: grid;
          gap: 10px;
          place-items: center;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .35px;
        }

        .empty-logo i {
          font-size: 34px;
          color: #555;
        }

       .upload-btn {
  height: 38px;

  display: grid;
  place-items: center;

  width: 100%;
  background: #101010;
  border: 1px solid #3a3a3a;
  color: #f2f2f2;
  border-radius: 8px;

  padding: 0 14px;

  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .35px;

  cursor: pointer;
}

        .upload-btn input {
          display: none;
        }

        .help {
  margin: 10px 0 0;
  color: #777;
  font-size: 11px;
  line-height: 1.45;
}

      .form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

      label {
  display: grid;
  gap: 6px;
  color: #9a9a9a;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .45px;
  text-transform: uppercase;
}

        label.full {
          grid-column: 1 / -1;
        }

        input,
textarea {
  width: 100%;
  background: #101010;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #f2f2f2;

  padding: 10px 12px;

  font-size: 13px;
  outline: none;
  font-family: Arial, sans-serif;

  text-transform: none;
  letter-spacing: 0;
  resize: vertical;
}

        input:focus,
        textarea:focus {
          border-color: ${BRAND_YELLOW};
        }

        input::placeholder,
        textarea::placeholder {
          color: #666;
        }

.social-field {
  gap: 6px;
}

.social-input {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;

  background: #101010;
  border: 1px solid #2a2a2a;
  border-radius: 8px;

  overflow: hidden;
}

.social-input i {
  height: 38px;
  display: grid;
  place-items: center;

  color: #FFC400;
  border-right: 1px solid #252525;
  font-size: 14px;
}

.social-input input {
  border: none;
  border-radius: 0;
  background: transparent;
}

       .actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

        .cancel-btn {
  height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  text-decoration: none;

  color: #d6d6d6;

  border: 1px solid #3a3a3a;
  border-radius: 8px;

  padding: 0 14px;

  font-size: 11px;
  font-weight: 900;
  letter-spacing: .35px;
}

        @media (max-width: 900px) {
          .dashboard {
            grid-template-columns: 1fr;
            padding: 10px 3% 40px;
          }

          .rail {
            min-height: 0;
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          .page-head {
            flex-direction: column;
          }

          .save-top {
            width: 100%;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .nav {
            height: 60px;
            padding: 8px 4%;
          }

          .logo-img {
            height: 34px;
          }

          .nav-links a:not(.yellow-link):not(.login-icon),
          .logout-btn {
            display: none;
          }

          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}
