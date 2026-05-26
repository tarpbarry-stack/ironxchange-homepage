import Head from "next/head";
import { useEffect, useState } from "react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SellerLogoDecal from "../../components/SellerLogoDecal";

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

      alert("Seller profile saved.");
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
       

       <Navbar />

                
        <section className="dashboard">
          <aside className="rail">
            <div className="rail-top">
              <SellerLogoDecal
  logo={logoPreview}
  name={form.companyName || "Seller"}
  variant="rail"
/>
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

<a href="/account/profile" className="active">
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
  <div className="head-copy">
    <a href="/account" className="back-link">
      ← Back to Dashboard
    </a>

   <h1>Public Seller Presence</h1>

    <p>
      Configure your public seller yard, listing identity, and dealership presence across IronXchange.
    </p>
  </div>

  <div className="profile-preview">
   <SellerLogoDecal
  logo={logoPreview}
  name={form.companyName || "Seller"}
  variant="live"
/>

    <div className="preview-copy">
      <span>Public Seller Yard</span>
      <strong>{form.companyName || "Seller Profile"}</strong>
      <p>{form.sellerLocation || "Location not listed"}</p>
    </div>
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
                <h2>Seller Branding</h2>

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
                      <a href="/account/listings" className="yard-preview-btn">
  View Listings
</a>
              </section>

              <section className="panel form-panel">
               <h2>Public Marketplace Identity</h2>
                      
               <div className="form-grid">
  <div className="form-section-title">Seller Identity</div>

  <label>
    Company Name
                    <input
                      value={form.companyName}
                      onChange={e => updateField("companyName", e.target.value)}
                      placeholder="Sell Equip Co."
                    />
                  </label>

                  <label>
                    Seller Name
                    <input
                      value={form.sellerName}
                      onChange={e => updateField("sellerName", e.target.value)}
                      placeholder="Name Here"
                    />
                  </label>

                  <div className="form-section-title">Contact</div>

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

                 <div className="form-section-title">Web Presence</div>

<label>
  Website
                    <input
                      value={form.website}
                      onChange={e => updateField("website", e.target.value)}
                      placeholder="www.yoursite.com"
                    />
                  </label>

                      <SocialInput
  icon="fa-brands fa-facebook-f"
  label="Facebook"
  value={form.facebookUrl}
  onChange={e => updateField("facebookUrl", e.target.value)}
  placeholder="facebook.com/company"
/>

<SocialInput
  icon="fa-brands fa-instagram"
  label="Instagram"
  value={form.instagramUrl}
  onChange={e => updateField("instagramUrl", e.target.value)}
  placeholder="instagram.com/company"
/>

<SocialInput
  icon="fa-brands fa-linkedin-in"
  label="LinkedIn"
  value={form.linkedinUrl}
  onChange={e => updateField("linkedinUrl", e.target.value)}
  placeholder="linkedin.com/company/company-name"
/>

<SocialInput
  icon="fa-brands fa-youtube"
  label="YouTube"
  value={form.youtubeUrl}
  onChange={e => updateField("youtubeUrl", e.target.value)}
  placeholder="youtube.com/@company"
/>

<SocialInput
  icon="fa-brands fa-tiktok"
  label="TikTok"
  value={form.tiktokUrl}
  onChange={e => updateField("tiktokUrl", e.target.value)}
  placeholder="tiktok.com/@company"
/>
                  <div className="form-section-title">About</div>

<label className="full">
  About Seller
                    <textarea
                      value={form.bio}
                      onChange={e => updateField("bio", e.target.value)}
                      placeholder="Short company overview for buyers viewing your listings and yard."
                      rows={5}
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
                    
<Footer />                    



<style jsx>{`
  :global(html),
  :global(body) {
    margin: 0;
    min-height: 100%;
    overflow-x: hidden;
    background: #0b0b0b;
    color: #d6d6d6;
    font-family: Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  * {
    box-sizing: border-box;
  }

  main {
    min-height: 100vh;

    background:
      radial-gradient(circle at top center, rgba(255,196,0,.032), transparent 28%),
      radial-gradient(circle at 18% 12%, rgba(255,255,255,.018), transparent 22%),
      #0b0b0b;
  }

  .dashboard {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);

    gap: 8px;

    max-width: 1680px;
    margin: 0 auto;

    padding: 10px 1.25% 14px;

    min-height: calc(100vh - 60px);
  }

  .rail {
    min-height: 0;
    overflow: hidden;

    padding: 6px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.06);
    outline: 1px solid rgba(255,255,255,.018);

    border-radius: 12px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset,
      0 14px 34px rgba(0,0,0,.18);
  }

  .rail-top {
    text-align: center;

    padding: 7px 4px 9px;
    margin-bottom: 6px;

    border-bottom: 1px solid rgba(255,255,255,.055);
  }

  .rail-top strong {
    display: block;

    color: #f2f2f2;

    font-size: 12px;
    font-weight: 950;

    letter-spacing: -.12px;
  }

  .rail-top span {
    display: block;

    margin-top: 3px;

    color: rgba(255,255,255,.38);

    font-size: 9.5px;
    font-weight: 800;

    text-transform: uppercase;
    letter-spacing: .42px;
  }

  .rail a {
    min-height: 38px;

    display: flex;
    align-items: center;
    gap: 8px;

    padding: 0 10px;

    color: rgba(255,255,255,.62);
    text-decoration: none;

    font-size: 10px;
    font-weight: 900;

    letter-spacing: .48px;
    text-transform: uppercase;

    border-radius: 10px;

    transition:
      background .14s ease,
      color .14s ease,
      transform .14s ease,
      border-color .14s ease;
  }

  .rail a.active,
  .rail a:hover {
    background:
      linear-gradient(180deg, rgba(255,196,0,.08), rgba(255,196,0,0)),
      #171717;

    color: #f2f2f2;

    transform: translateX(2px);
  }

  .rail i {
    width: 16px;
    color: #FFC400;
  }

  .content {
    min-width: 0;
    min-height: 0;
  }

  .page-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px auto;
    align-items: center;

    gap: 12px;

    margin-bottom: 8px;
    padding: 12px 14px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.024), rgba(255,255,255,0)),
      radial-gradient(circle at top, rgba(255,255,255,.012), transparent 72%),
      #111111;

    border: 1px solid rgba(255,255,255,.065);
    outline: 1px solid rgba(255,255,255,.018);

    border-radius: 12px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.03) inset,
      0 14px 34px rgba(0,0,0,.18);
  }

  .head-copy {
    min-width: 0;
  }

  .back-link {
    display: inline-block;

    margin-bottom: 10px;

    color: rgba(255,255,255,.40);
    text-decoration: none;

    font-size: 9px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .62px;

    transition:
      color .14s ease,
      transform .14s ease;
  }

  .back-link:hover {
    color: #FFC400;
    transform: translateX(-2px);
  }

  h1 {
    margin: 0;

    color: #f2f2f2;

    font-size: 23px;
    font-weight: 950;

    letter-spacing: -.42px;
    line-height: 1;

    text-transform: uppercase;
  }

  .page-head p {
    max-width: 760px;

    margin: 7px 0 0;

    color: rgba(255,255,255,.42);

    font-size: 12px;
    font-weight: 600;

    line-height: 1.45;
  }

  .profile-preview {
    min-height: 58px;

    display: flex;
    align-items: center;
    gap: 11px;

    padding: 8px 10px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
      #0f0f0f;

    border: 1px solid rgba(255,255,255,.06);
    border-radius: 11px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset;
  }

  .preview-copy {
    min-width: 0;
  }

  .profile-preview span {
    display: block;

    color: #FFC400;

    font-size: 8.5px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .62px;
  }

  .profile-preview strong {
    display: block;

    margin-top: 3px;

    color: #f2f2f2;

    font-size: 13px;
    font-weight: 950;

    text-transform: uppercase;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-preview p {
    margin: 3px 0 0;

    color: rgba(255,255,255,.40);

    font-size: 10.5px;
    font-weight: 800;

    text-transform: uppercase;
    letter-spacing: .25px;
  }

  .save-top,
  .save-btn {
    height: 36px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0 15px;

    background:
      linear-gradient(180deg, rgba(255,196,0,.08), rgba(255,196,0,0)),
      #151515;

    border: 1px solid rgba(255,196,0,.24);
    border-radius: 10px;

    color: #FFC400;

    font-size: 9.5px;
    font-weight: 950;

    letter-spacing: .58px;
    text-transform: uppercase;

    cursor: pointer;
    white-space: nowrap;

    box-shadow:
      0 1px 0 rgba(255,255,255,.035) inset,
      0 0 18px rgba(255,196,0,.045);

    transition:
      transform .14s ease,
      border-color .14s ease,
      background .14s ease,
      box-shadow .14s ease;
  }

  .save-top:hover,
  .save-btn:hover {
    transform: translateY(-1px);

    background:
      linear-gradient(180deg, rgba(255,196,0,.14), rgba(255,196,0,0)),
      #1a1400;

    border-color: rgba(255,196,0,.58);

    box-shadow:
      0 1px 0 rgba(255,255,255,.05) inset,
      0 12px 28px rgba(0,0,0,.22),
      0 0 20px rgba(255,196,0,.065);
  }

  .save-top:disabled,
  .save-btn:disabled {
    opacity: .58;
    cursor: default;
    transform: none;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 285px minmax(0, 1fr);

    gap: 8px;
  }

  .panel {
    padding: 16px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,0)),
      radial-gradient(circle at top, rgba(255,255,255,.012), transparent 68%),
      #101010;

    border: 1px solid rgba(255,255,255,.065);
    outline: 1px solid rgba(255,255,255,.018);

    border-radius: 12px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.03) inset,
      0 14px 34px rgba(0,0,0,.18);
  }

  .panel h2 {
    margin: 0 0 12px;

    color: rgba(255,255,255,.84);

    font-size: 11px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .68px;
  }

  .logo-panel {
    align-self: start;
  }

  .logo-preview-box {
    width: 100%;
    height: 126px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 16px;
    margin-bottom: 10px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #0b0b0b;

    border: 1px solid rgba(255,255,255,.06);
    border-radius: 11px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset;
  }

  .logo-preview-box img {
    max-width: 100%;
    max-height: 100%;

    width: auto;
    height: auto;

    object-fit: contain;
    display: block;
  }

  .empty-logo {
    display: grid;
    place-items: center;
    gap: 9px;

    color: rgba(255,255,255,.36);

    font-size: 10px;
    font-weight: 900;

    text-transform: uppercase;
    letter-spacing: .42px;
  }

  .empty-logo i {
    color: rgba(255,255,255,.28);
    font-size: 32px;
  }

  .upload-btn {
    width: 100%;
    height: 38px;

    display: grid;
    place-items: center;

    padding: 0 14px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.075);
    border-radius: 10px;

    color: rgba(255,255,255,.74);

    font-size: 10px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .52px;

    cursor: pointer;

    transition:
      border-color .14s ease,
      color .14s ease,
      background .14s ease,
      transform .14s ease;
  }

  .upload-btn:hover {
    transform: translateY(-1px);

    color: #FFC400;
    border-color: rgba(255,196,0,.30);

    background:
      linear-gradient(180deg, rgba(255,196,0,.045), rgba(255,196,0,0)),
      #151515;
  }

  .upload-btn input {
    display: none;
  }

  .help {
    margin: 10px 0 0;

    color: rgba(255,255,255,.38);

    font-size: 10px;
    font-weight: 600;

    line-height: 1.45;
  }

  .yard-preview-btn {
    width: 100%;
    height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    margin-top: 10px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.065);
    border-radius: 10px;

    color: rgba(255,255,255,.68);
    text-decoration: none;

    font-size: 9px;
    font-weight: 950;

    letter-spacing: .55px;
    text-transform: uppercase;

    transition:
      color .14s ease,
      border-color .14s ease,
      background .14s ease,
      transform .14s ease;
  }

  .yard-preview-btn:hover {
    transform: translateY(-1px);

    color: #FFC400;
    border-color: rgba(255,196,0,.28);

    background:
      linear-gradient(180deg, rgba(255,196,0,.04), rgba(255,196,0,0)),
      #151515;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;

    gap: 9px 10px;
  }

  .form-section-title {
    grid-column: 1 / -1;

    margin-top: 11px;
    padding-top: 12px;

    border-top: 1px solid rgba(255,255,255,.055);

    color: #FFC400;

    font-size: 8.75px;
    font-weight: 950;

    letter-spacing: .72px;
    text-transform: uppercase;
  }

  .form-section-title:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  label {
    display: grid;
    gap: 5px;

    color: rgba(255,255,255,.42);

    font-size: 8.75px;
    font-weight: 950;

    letter-spacing: .55px;
    text-transform: uppercase;
  }

  label.full {
    grid-column: 1 / -1;
  }

  input,
  textarea {
    width: 100%;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.075);
    border-radius: 10px;

    color: #f2f2f2;

    padding: 8px 11px;

    font-size: 12px;
    font-weight: 600;

    outline: none;

    font-family: Arial, sans-serif;

    text-transform: none;
    letter-spacing: 0;

    resize: vertical;

    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset;

    transition:
      border-color .14s ease,
      box-shadow .14s ease,
      background .14s ease;
  }

  input {
    height: 34px;
  }

  textarea {
    min-height: 94px;
    line-height: 1.45;
  }

  input:hover,
  textarea:hover {
    border-color: rgba(255,255,255,.13);
  }

  input:focus,
  textarea:focus,
  :global(.social-input:focus-within) {
    border-color: rgba(255,196,0,.44);

    box-shadow:
      0 0 0 1px rgba(255,196,0,.14),
      0 1px 0 rgba(255,255,255,.028) inset;

    background: #121212;
  }

  input::placeholder,
  textarea::placeholder {
    color: rgba(255,255,255,.26);
  }

  :global(.social-field) {
    display: grid;
    gap: 5px;

    color: rgba(255,255,255,.42);

    font-size: 8.75px;
    font-weight: 950;

    letter-spacing: .55px;
    text-transform: uppercase;
  }

  :global(.social-input) {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr);
    align-items: center;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.075);
    border-radius: 10px;

    overflow: hidden;

    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset;

    transition:
      border-color .14s ease,
      box-shadow .14s ease,
      background .14s ease;
  }

  :global(.social-input i) {
    height: 34px;

    display: grid;
    place-items: center;

    color: rgba(255,255,255,.34);

    font-size: 13px;
  }

  :global(.social-input input) {
    width: 100%;
    height: 34px;

    border: none !important;
    border-radius: 0 !important;

    background: transparent !important;
    color: #f2f2f2 !important;

    padding: 8px 11px;

    font-size: 12px;
    font-weight: 600;

    outline: none !important;
    box-shadow: none !important;
  }

  :global(.social-input input::placeholder) {
    color: rgba(255,255,255,.26);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 7px;

    margin-top: 16px;
    padding-top: 12px;

    border-top: 1px solid rgba(255,255,255,.055);
  }

  .cancel-btn {
    height: 36px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0 14px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.065);
    border-radius: 10px;

    color: rgba(255,255,255,.52);
    text-decoration: none;

    font-size: 9.5px;
    font-weight: 950;

    letter-spacing: .55px;
    text-transform: uppercase;

    transition:
      color .14s ease,
      border-color .14s ease,
      background .14s ease,
      transform .14s ease;
  }

  .cancel-btn:hover {
    transform: translateY(-1px);

    color: #f2f2f2;
    border-color: rgba(255,255,255,.14);
    background: #151515;
  }

  @media (max-width: 1000px) {
    .dashboard {
      grid-template-columns: 1fr;
      padding: 10px 3% 40px;
    }

    .rail {
      min-height: 0;
    }

    .page-head {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .profile-preview {
      width: 100%;
    }

    .save-top {
      width: 100%;
    }

    .profile-grid {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 650px) {
    .dashboard {
      padding: 10px 4% 40px;
    }

    h1 {
      font-size: 23px;
    }

    .panel {
      padding: 14px;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .cancel-btn,
    .save-btn {
      width: 100%;
    }
  }
`}</style>
              
    </>
  );
}
