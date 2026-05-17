import Head from "next/head";
import { useMemo, useState } from "react";

const BRAND_YELLOW = "#FFC400";

const CATEGORIES = [
  "Excavators",
  "Wheel Loaders",
  "Dozers",
  "Motor Graders",
  "Backhoes",
  "Skid Steers",
  "Compaction",
  "Articulated Trucks",
  "Support Equipment",
  "Attachments / Parts"
];

export default function PostFreePage() {
  const [form, setForm] = useState({
    category: "",
    year: "",
    make: "",
    model: "",
    hours: "",
    price: "",
    location: "",
    description: ""
  });

  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  }

  const title = useMemo(() => {
    const parts = [form.year, form.make, form.model].filter(Boolean).join(" ");
    return form.hours ? `${parts} – ${form.hours} Hrs` : parts;
  }, [form]);

  function handlePhotos(e) {
    const files = Array.from(e.target.files || []);

    const mapped = files.slice(0, 24).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPhotos(mapped);
  }

  function validate() {
    const required = ["category", "year", "make", "model", "hours", "price", "location"];

    for (const field of required) {
      if (!String(form[field]).trim()) {
        return `${field.toUpperCase()} is required.`;
      }
    }

    if (!/^\d{4}$/.test(form.year)) return "YEAR must be 4 digits.";
    if (!/^\d{1,5}$/.test(String(form.hours).replace(/,/g, ""))) {
      return "HOURS must be 1–5 digits.";
    }

    if (!/^\d+$/.test(String(form.price).replace(/[$,]/g, ""))) {
      return "PRICE must be numbers only.";
    }

    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();

    const problem = validate();

    if (problem) {
      setError(problem);
      return;
    }

    const draft = {
      ...form,
      title,
      photosCount: photos.length,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem("ironxchangePostFreeDraft", JSON.stringify(draft));

    alert("Draft saved. Next step is wiring this submit to Sharetribe listing creation.");
  }

  return (
    <>
      <Head>
        <title>Post Free | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img src="/images/ironxchange-logo.png" className="logo-img" alt="IronXchange" />
          </a>

          <div className="nav-links">
            <a href="/browse">SEARCH</a>
            <a href="/account">ACCOUNT</a>
          </div>
        </nav>

        <section className="page">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="head">
              <h1>Post Free Listing</h1>
              <p>Required fields first. Photos next. Submit last.</p>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="grid">
              <label>
                <span>Category</span>
                <select value={form.category} onChange={e => updateField("category", e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Year</span>
                <input value={form.year} onChange={e => updateField("year", e.target.value)} placeholder="2021" maxLength={4} />
              </label>

              <label>
                <span>Make</span>
                <input value={form.make} onChange={e => updateField("make", e.target.value)} placeholder="Komatsu" />
              </label>

              <label>
                <span>Model</span>
                <input value={form.model} onChange={e => updateField("model", e.target.value)} placeholder="PC210LC-11" />
              </label>

              <label>
                <span>Hours</span>
                <input value={form.hours} onChange={e => updateField("hours", e.target.value)} placeholder="4987" maxLength={5} />
              </label>

              <label>
                <span>Price</span>
                <input value={form.price} onChange={e => updateField("price", e.target.value)} placeholder="68900" />
              </label>

              <label className="wide">
                <span>Location</span>
                <input value={form.location} onChange={e => updateField("location", e.target.value)} placeholder="Amarillo, TX" />
              </label>
            </div>

            <label className="photos">
              <span>Photos</span>
              <input type="file" multiple accept="image/*" onChange={handlePhotos} />
            </label>

            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((photo, index) => (
                  <img key={index} src={photo.url} alt={`Upload ${index + 1}`} />
                ))}
              </div>
            )}

            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={e => updateField("description", e.target.value)}
                placeholder="Straight machine. Tight. No known codes. Ready to work."
              />
            </label>

            <button type="submit">SAVE DRAFT</button>
          </form>

          <aside className="preview-panel">
            <h2>Preview</h2>

            <div className="preview-card">
              <div className="preview-img">
                {photos[0] ? <img src={photos[0].url} alt="Preview" /> : "Photo"}
              </div>

              <div className="preview-body">
                <strong>{title || "Year Make Model – Hours"}</strong>
                <span>{form.price ? `$${Number(String(form.price).replace(/,/g, "")).toLocaleString()}` : "Price"}</span>
                <p>{form.location || "Location"}</p>
              </div>
            </div>
          </aside>
        </section>

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

          .nav {
            height: 64px;
            background: #050505;
            border-bottom: 1px solid rgba(255,255,255,.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 2%;
          }

          .logo-img {
            height: 38px;
          }

          .nav-links {
            display: flex;
            gap: 18px;
          }

          .nav-links a {
            color: white;
            text-decoration: none;
            font-size: 12px;
            font-weight: 900;
          }

          .page {
            max-width: 1500px;
            margin: 0 auto;
            padding: 14px 2%;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 10px;
          }

          .form-panel,
          .preview-panel {
            background: #151515;
            border: 1px solid #282828;
            border-radius: 14px;
            padding: 14px;
          }

          .head h1 {
            margin: 0;
            color: #f2f2f2;
            font-size: 22px;
            font-weight: 900;
          }

          .head p {
            margin: 4px 0 14px;
            color: #888;
            font-size: 12px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          label {
            display: grid;
            gap: 6px;
            margin-bottom: 10px;
          }

          label span {
            color: #8f8f8f;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
          }

          input,
          select,
          textarea {
            width: 100%;
            background: #101010;
            border: 1px solid #2A2A2A;
            color: #f2f2f2;
            border-radius: 10px;
            padding: 11px;
            outline: none;
            font-size: 14px;
          }

          textarea {
            min-height: 110px;
            resize: vertical;
          }

          input:focus,
          select:focus,
          textarea:focus {
            border-color: ${BRAND_YELLOW};
          }

          .wide {
            grid-column: 1 / -1;
          }

          .photos input {
            padding: 16px;
            border-style: dashed;
          }

          .photo-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }

          .photo-grid img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #2A2A2A;
          }

          button {
            width: 100%;
            background: ${BRAND_YELLOW};
            border: none;
            color: #050505;
            font-weight: 900;
            padding: 13px;
            border-radius: 10px;
            cursor: pointer;
          }

          .error {
            background: rgba(229, 62, 62, .12);
            border: 1px solid #E53E3E;
            color: #ffb4b4;
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 10px;
            font-size: 13px;
            font-weight: 800;
          }

          .preview-panel h2 {
            margin: 0 0 10px;
            color: #f2f2f2;
            font-size: 14px;
            text-transform: uppercase;
          }

          .preview-card {
            background: #101010;
            border: 1px solid #282828;
            border-radius: 12px;
            overflow: hidden;
          }

          .preview-img {
            height: 220px;
            display: grid;
            place-items: center;
            color: #666;
            background: #0b0b0b;
          }

          .preview-img img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .preview-body {
            padding: 12px;
          }

          .preview-body strong {
            display: block;
            color: #f2f2f2;
            font-size: 15px;
          }

          .preview-body span {
            display: block;
            color: ${BRAND_YELLOW};
            font-weight: 900;
            margin-top: 6px;
          }

          .preview-body p {
            margin: 5px 0 0;
            color: #888;
            font-size: 12px;
          }

          @media (max-width: 800px) {
            .page {
              grid-template-columns: 1fr;
            }

            .grid {
              grid-template-columns: 1fr;
            }

            .photo-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
        `}</style>
      </main>
    </>
  );
}
